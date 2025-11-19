import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Paragraph,
  Divider,
  List,
} from 'react-native-paper';
import { clearAllData, getServerUrl, getApiKey } from '../utils/storage';
import apiClient from '../services/api';
import { COLORS, APP_NAME, APP_VERSION } from '../utils/constants';

export default function SettingsScreen({ navigation }) {
  const [loginVisible, setLoginVisible] = useState(false);
  const [emailVisible, setEmailVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login form
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');

  // Email form
  const [emailHost, setEmailHost] = useState('smtp.gmail.com');
  const [emailPort, setEmailPort] = useState('587');
  const [emailUser, setEmailUser] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [emailTo, setEmailTo] = useState('');

  const handleLogin = async () => {
    if (!userId || !password || !totp) {
      Alert.alert('Error', 'Please fill all login fields');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.loginToKite({
        userId,
        password,
        totp,
      });

      if (response.success) {
        Alert.alert('Success', 'Login successful! Enctoken updated.');
        setUserId('');
        setPassword('');
        setTotp('');
        setLoginVisible(false);
      } else {
        Alert.alert('Error', response.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConfig = async () => {
    if (!emailHost || !emailUser || !emailPass || !emailTo) {
      Alert.alert('Error', 'Please fill all email fields');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.configureEmail({
        host: emailHost,
        port: parseInt(emailPort) || 587,
        user: emailUser,
        pass: emailPass,
        to: emailTo,
      });

      if (response.success) {
        Alert.alert('Success', 'Email configuration saved!');
        setEmailVisible(false);
      } else {
        Alert.alert('Error', response.error || 'Failed to save email config');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      const response = await apiClient.sendTestEmail();
      if (response.success) {
        Alert.alert('Success', 'Test email sent successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to send test email');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache?',
      'This will delete all cached historical data files.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await apiClient.clearCache();
              if (response.success) {
                Alert.alert('Success', response.message);
              } else {
                Alert.alert('Error', response.error);
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearLogs = async () => {
    Alert.alert(
      'Clear Logs?',
      'This will clear all log files. A backup will be created.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await apiClient.clearLogs();
              if (response.success) {
                Alert.alert('Success', response.message);
              } else {
                Alert.alert('Error', response.error);
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout?',
      'This will clear all stored credentials. You will need to set up again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            navigation.replace('Setup');
          },
        },
      ]
    );
  };

  const showConnectionInfo = async () => {
    const serverUrl = await getServerUrl();
    const apiKey = await getApiKey();
    Alert.alert(
      'Connection Info',
      `Server: ${serverUrl}\n\nAPI Key: ${apiKey?.substring(0, 16)}...`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Kite Account</Title>
          <Divider style={styles.divider} />

          {!loginVisible ? (
            <Button
              mode="contained"
              onPress={() => setLoginVisible(true)}
              style={styles.button}
              icon="login"
            >
              Login to Kite
            </Button>
          ) : (
            <View>
              <TextInput
                label="User ID"
                value={userId}
                onChangeText={setUserId}
                mode="outlined"
                autoCapitalize="characters"
                placeholder="AB1234"
                style={styles.input}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                label="2FA Code (TOTP)"
                value={totp}
                onChangeText={setTotp}
                mode="outlined"
                keyboardType="numeric"
                placeholder="123456"
                maxLength={6}
                style={styles.input}
              />
              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.halfButton}
                >
                  Login
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setLoginVisible(false)}
                  disabled={loading}
                  style={styles.halfButton}
                >
                  Cancel
                </Button>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Email Alerts Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Email Alerts</Title>
          <Divider style={styles.divider} />

          {!emailVisible ? (
            <>
              <Button
                mode="contained"
                onPress={() => setEmailVisible(true)}
                style={styles.button}
                icon="email-outline"
              >
                Configure Email
              </Button>
              <Button
                mode="outlined"
                onPress={handleTestEmail}
                loading={loading}
                disabled={loading}
                style={styles.button}
                icon="email-send"
              >
                Send Test Email
              </Button>
            </>
          ) : (
            <View>
              <TextInput
                label="SMTP Host"
                value={emailHost}
                onChangeText={setEmailHost}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="SMTP Port"
                value={emailPort}
                onChangeText={setEmailPort}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                label="Email User"
                value={emailUser}
                onChangeText={setEmailUser}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                label="Email Password"
                value={emailPass}
                onChangeText={setEmailPass}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                label="Alert Email To"
                value={emailTo}
                onChangeText={setEmailTo}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={handleEmailConfig}
                  loading={loading}
                  disabled={loading}
                  style={styles.halfButton}
                >
                  Save
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setEmailVisible(false)}
                  disabled={loading}
                  style={styles.halfButton}
                >
                  Cancel
                </Button>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Maintenance Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Maintenance</Title>
          <Divider style={styles.divider} />

          <Button
            mode="outlined"
            onPress={handleClearCache}
            loading={loading}
            disabled={loading}
            style={styles.button}
            icon="delete-sweep"
          >
            Clear Cache
          </Button>

          <Button
            mode="outlined"
            onPress={handleClearLogs}
            loading={loading}
            disabled={loading}
            style={styles.button}
            icon="file-remove"
          >
            Clear Logs
          </Button>
        </Card.Content>
      </Card>

      {/* App Info Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>App Info</Title>
          <Divider style={styles.divider} />

          <List.Item
            title={APP_NAME}
            description={`Version ${APP_VERSION}`}
            left={props => <List.Icon {...props} icon="information" />}
          />

          <Button
            mode="outlined"
            onPress={showConnectionInfo}
            style={styles.button}
            icon="server"
          >
            Connection Info
          </Button>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}
            icon="logout"
          >
            Logout & Reset
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginVertical: 5,
    paddingVertical: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  logoutButton: {
    backgroundColor: COLORS.ERROR,
  },
});
