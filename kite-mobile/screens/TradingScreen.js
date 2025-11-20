import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Switch,
  Paragraph,
  HelperText,
  Divider,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../services/api';
import { COLORS, TIMEFRAMES, DEFAULT_PARAMS, TRADING_STATUS } from '../utils/constants';

export default function TradingScreen() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [instruments, setInstruments] = useState([]);

  // Trading parameters
  const [tradingsymbol, setTradingsymbol] = useState('');
  const [capital, setCapital] = useState(DEFAULT_PARAMS.CAPITAL.toString());
  const [timeframe, setTimeframe] = useState(DEFAULT_PARAMS.TIMEFRAME);
  const [slTicks, setSlTicks] = useState(DEFAULT_PARAMS.SL_TICKS.toString());
  const [targetTicks, setTargetTicks] = useState(DEFAULT_PARAMS.TARGET_TICKS.toString());
  const [riskPct, setRiskPct] = useState((DEFAULT_PARAMS.RISK_PCT * 100).toString());
  const [paper, setPaper] = useState(false);
  const [notimeexit, setNotimeexit] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchStatus();
    fetchInstruments();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await apiClient.getStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchInstruments = async () => {
    try {
      const response = await apiClient.getInstruments();
      if (response.success && response.data.length > 0) {
        setInstruments(response.data);
        setTradingsymbol(response.data[0]); // Set default to the first one
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
      const errorMessage = `Failed to fetch instruments: ${error.message}`;
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const validateInputs = () => {
    const newErrors = {};

    if (!tradingsymbol) {
      newErrors.tradingsymbol = 'Trading Symbol is required';
    }

    if (!capital.trim()) {
      newErrors.capital = 'Capital is required';
    } else if (isNaN(parseFloat(capital)) || parseFloat(capital) <= 0) {
      newErrors.capital = 'Must be a positive number';
    }

    if (!slTicks.trim()) {
      newErrors.slTicks = 'SL ticks is required';
    } else if (isNaN(parseInt(slTicks)) || parseInt(slTicks) <= 0) {
      newErrors.slTicks = 'Must be a positive number';
    }

    if (!targetTicks.trim()) {
      newErrors.targetTicks = 'Target ticks is required';
    } else if (isNaN(parseInt(targetTicks)) || parseInt(targetTicks) <= 0) {
      newErrors.targetTicks = 'Must be a positive number';
    }

    if (!riskPct.trim()) {
      newErrors.riskPct = 'Risk % is required';
    } else if (isNaN(parseFloat(riskPct)) || parseFloat(riskPct) <= 0 || parseFloat(riskPct) > 10) {
      newErrors.riskPct = 'Must be between 0 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartTrading = async () => {
    if (!validateInputs()) {
      if (Platform.OS === 'web') {
        window.alert('Validation Error: Please fix the errors before starting.');
      } else {
        Alert.alert('Validation Error', 'Please fix the errors before starting.');
      }
      return;
    }

    const start = async () => {
      setLoading(true);
      try {
        const params = {
          tradingsymbol,
          capital: parseFloat(capital),
          timeframe,
          slTicks: parseInt(slTicks),
          targetTicks: parseInt(targetTicks),
          riskPercent: parseFloat(riskPct) / 100,
        };

        if (paper) params.paper = true;
        if (notimeexit) params.notimeexit = true;

        const response = await apiClient.startTrading(params);

        if (response.success) {
          if (Platform.OS === 'web') {
            window.alert('Success: Trading started successfully.');
          } else {
            Alert.alert('Success', 'Trading started successfully.');
          }
          fetchStatus();
        } else {
          const errorMessage = response.error || 'Failed to start trading';
          if (Platform.OS === 'web') {
            window.alert(`Error: ${errorMessage}`);
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      } catch (error) {
        const errorMessage = error.message || 'An unknown error occurred.';
        if (Platform.OS === 'web') {
          window.alert(`Error: ${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Start Trading?\nAre you sure you want to start the trading bot with these parameters?')) {
        start();
      }
    } else {
      Alert.alert(
        'Start Trading?',
        'Are you sure you want to start the trading bot with these parameters?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start', onPress: start },
        ]
      );
    }
  };

  const handleStopTrading = async () => {
    const stop = async () => {
      setLoading(true);
      try {
        const response = await apiClient.stopTrading();
        if (response.success) {
          if (Platform.OS === 'web') {
            window.alert('Success: Trading stopped successfully.');
          } else {
            Alert.alert('Success', 'Trading stopped successfully.');
          }
          fetchStatus();
        } else {
          const errorMessage = response.error || 'Failed to stop trading';
          if (Platform.OS === 'web') {
            window.alert(`Error: ${errorMessage}`);
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      } catch (error) {
        const errorMessage = error.message || 'An unknown error occurred.';
        if (Platform.OS === 'web') {
          window.alert(`Error: ${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Stop Trading?\nAre you sure you want to stop the trading bot?')) {
        stop();
      }
    } else {
      Alert.alert(
        'Stop Trading?',
        'Are you sure you want to stop the trading bot?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop', style: 'destructive', onPress: stop },
        ]
      );
    }
  };

  const handleRestartTrading = async () => {
    if (!validateInputs()) {
      if (Platform.OS === 'web') {
        window.alert('Validation Error: Please fix the errors before restarting.');
      } else {
        Alert.alert('Validation Error', 'Please fix the errors before restarting.');
      }
      return;
    }

    const restart = async () => {
      setLoading(true);
      try {
        const params = {
          tradingsymbol,
          capital: parseFloat(capital),
          timeframe,
          slTicks: parseInt(slTicks),
          targetTicks: parseInt(targetTicks),
          riskPercent: parseFloat(riskPct) / 100,
        };

        if (paper) params.paper = true;
        if (notimeexit) params.notimeexit = true;

        const response = await apiClient.restartTrading(params);

        if (response.success) {
          if (Platform.OS === 'web') {
            window.alert('Success: Trading restarted successfully.');
          } else {
            Alert.alert('Success', 'Trading restarted successfully.');
          }
          fetchStatus();
        } else {
          const errorMessage = response.error || 'Failed to restart trading';
          if (Platform.OS === 'web') {
            window.alert(`Error: ${errorMessage}`);
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      } catch (error) {
        const errorMessage = error.message || 'An unknown error occurred.';
        if (Platform.OS === 'web') {
          window.alert(`Error: ${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Restart Trading?\nThis will stop the current bot and start a new one with updated parameters.')) {
        restart();
      }
    } else {
      Alert.alert(
        'Restart Trading?',
        'This will stop the current bot and start a new one with updated parameters.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restart', onPress: restart },
        ]
      );
    }
  };

  const isRunning = status?.trading === TRADING_STATUS.RUNNING;

  return (
    <ScrollView style={styles.container}>
      {/* Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Trading Status</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.statusText}>
            Status: <Paragraph style={[styles.statusValue, { color: isRunning ? COLORS.SUCCESS : COLORS.ERROR }]}>
              {status?.trading || 'Unknown'}
            </Paragraph>
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Trading Parameters Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Trading Parameters</Title>
          <Divider style={styles.divider} />

          <View style={styles.pickerContainer}>
            <Paragraph style={styles.pickerLabel}>Trading Symbol</Paragraph>
            <Picker
              selectedValue={tradingsymbol}
              onValueChange={(itemValue) => setTradingsymbol(itemValue)}
              style={styles.picker}
              enabled={instruments.length > 0}
            >
              {instruments.map(symbol => (
                <Picker.Item key={symbol} label={symbol} value={symbol} />
              ))}
            </Picker>
            {errors.tradingsymbol && (
              <HelperText type="error">{errors.tradingsymbol}</HelperText>
            )}
          </View>

          <TextInput
            label="Capital (₹)"
            value={capital}
            onChangeText={setCapital}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.capital}
            style={styles.input}
          />
          {errors.capital && (
            <HelperText type="error">{errors.capital}</HelperText>
          )}

          <View style={styles.pickerContainer}>
            <Paragraph style={styles.pickerLabel}>Timeframe</Paragraph>
            <Picker
              selectedValue={timeframe}
              onValueChange={setTimeframe}
              style={styles.picker}
            >
              {TIMEFRAMES.map(tf => (
                <Picker.Item key={tf.value} label={tf.label} value={tf.value} />
              ))}
            </Picker>
          </View>

          <TextInput
            label="Stop Loss (Ticks)"
            value={slTicks}
            onChangeText={setSlTicks}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.slTicks}
            style={styles.input}
          />
          {errors.slTicks && (
            <HelperText type="error">{errors.slTicks}</HelperText>
          )}

          <TextInput
            label="Target (Ticks)"
            value={targetTicks}
            onChangeText={setTargetTicks}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.targetTicks}
            style={styles.input}
          />
          {errors.targetTicks && (
            <HelperText type="error">{errors.targetTicks}</HelperText>
          )}

          <TextInput
            label="Risk Per Trade (%)"
            value={riskPct}
            onChangeText={setRiskPct}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.riskPct}
            style={styles.input}
          />
          {errors.riskPct && (
            <HelperText type="error">{errors.riskPct}</HelperText>
          )}

          <View style={styles.switchRow}>
            <Paragraph>Paper Trading (Demo)</Paragraph>
            <Switch value={paper} onValueChange={setPaper} />
          </View>

          <View style={styles.switchRow}>
            <Paragraph>No Time Exit</Paragraph>
            <Switch value={notimeexit} onValueChange={setNotimeexit} />
          </View>
        </Card.Content>
      </Card>

      {/* Control Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          {!isRunning ? (
            <Button
              mode="contained"
              onPress={handleStartTrading}
              loading={loading}
              disabled={loading}
              style={[styles.button, styles.startButton]}
              icon="play"
            >
              Start Trading
            </Button>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={handleStopTrading}
                loading={loading}
                disabled={loading}
                style={[styles.button, styles.stopButton]}
                icon="stop"
              >
                Stop Trading
              </Button>
              <Button
                mode="outlined"
                onPress={handleRestartTrading}
                loading={loading}
                disabled={loading}
                style={styles.button}
                icon="restart"
              >
                Restart with New Parameters
              </Button>
            </>
          )}
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
  statusText: {
    fontSize: 16,
  },
  statusValue: {
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 5,
  },
  pickerContainer: {
    marginVertical: 10,
  },
  pickerLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 5,
  },
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  button: {
    marginVertical: 5,
    paddingVertical: 6,
  },
  startButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  stopButton: {
    backgroundColor: COLORS.ERROR,
  },
});
