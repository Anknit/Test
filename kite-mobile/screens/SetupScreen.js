import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
} from 'react-native';
import { TextInput, Button, Title, Paragraph, HelperText } from 'react-native-paper';
import { saveApiKey, saveServerUrl, setSetupComplete } from '../utils/storage';
import apiClient from '../services/api';
import { COLORS } from '../utils/constants';

export default function SetupScreen({ onSetupComplete }) {
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};

    if (!serverUrl.trim()) {
      newErrors.serverUrl = 'Server URL is required';
    } else if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
      newErrors.serverUrl = 'URL must start with http:// or https://';
    }

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API Key is required';
    } else if (apiKey.length < 32) {
      newErrors.apiKey = 'API Key seems too short';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testConnection = async () => {
    if (!validateInputs()) {
      return;
    }

    setTesting(true);

    try {
      // Save temporarily to test
      await saveServerUrl(serverUrl);
      await saveApiKey(apiKey);
      await apiClient.initialize();

      // Test connection
      const health = await apiClient.checkHealth();

      if (health.status === 'ok') {
        if (Platform.OS === 'web') {
          if (window.confirm('Connection Successful! ✅\nServer is reachable and API key is valid.\n\nPress OK to continue.')) {
            handleSetupComplete();
          }
        } else {
          Alert.alert(
            'Connection Successful! ✅',
            'Server is reachable and API key is valid.',
            [
              {
                text: 'Continue',
                onPress: handleSetupComplete,
              },
            ]
          );
        }
      } else {
        throw new Error('Server returned error status');
      }
    } catch (error) {
      const errorMessage = `Unable to connect to server:\n\n${error.message}\n\nPlease check your server URL and API key.`;
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert(
          'Connection Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSetupComplete = async () => {
    await setSetupComplete();
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Title style={styles.title}>Welcome to Kite Trading Bot</Title>
          <Paragraph style={styles.subtitle}>
            Connect to your trading bot server to get started
          </Paragraph>

          <View style={styles.form}>
            {/* Server URL Input */}
            <TextInput
              label="Server URL"
              value={serverUrl}
              onChangeText={setServerUrl}
              mode="outlined"
              placeholder="http://192.168.1.100:3000"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              error={!!errors.serverUrl}
              style={styles.input}
            />
            {errors.serverUrl && (
              <HelperText type="error" visible={true}>
                {errors.serverUrl}
              </HelperText>
            )}
            <Paragraph style={styles.hint}>
              Enter your bot server IP address and port.{'\n'}
              Example: http://192.168.1.100:3000
            </Paragraph>

            {/* API Key Input */}
            <TextInput
              label="API Key"
              value={apiKey}
              onChangeText={setApiKey}
              mode="outlined"
              placeholder="Enter your API key"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              error={!!errors.apiKey}
              style={styles.input}
            />
            {errors.apiKey && (
              <HelperText type="error" visible={true}>
                {errors.apiKey}
              </HelperText>
            )}
            <Paragraph style={styles.hint}>
              Get your API key from the server startup logs or .env file
            </Paragraph>

            {/* Test Connection Button */}
            <Button
              mode="contained"
              onPress={testConnection}
              loading={testing}
              disabled={testing}
              style={styles.button}
            >
              {testing ? 'Testing Connection...' : 'Test Connection'}
            </Button>
          </View>

          <View style={styles.helpSection}>
            <Title style={styles.helpTitle}>Setup Instructions</Title>
            <Paragraph style={styles.helpText}>
              1. Start your bot server: <Text style={styles.code}>node api-server.js</Text>
            </Paragraph>
            <Paragraph style={styles.helpText}>
              2. Copy the API key from server logs
            </Paragraph>
            <Paragraph style={styles.helpText}>
              3. Find your server's IP address on the same network
            </Paragraph>
            <Paragraph style={styles.helpText}>
              4. Enter both values above and test connection
            </Paragraph>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: COLORS.PRIMARY,
  },
  subtitle: {
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
  },
  input: {
    marginBottom: 5,
  },
  hint: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 20,
    lineHeight: 16,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  helpSection: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    lineHeight: 20,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 2,
    fontSize: 12,
  },
});
