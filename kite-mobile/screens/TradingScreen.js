import React, { useState, useEffect } from 'react';
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

  // Trading parameters
  const [instrument, setInstrument] = useState('120395527'); // NIFTY BANK
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
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await apiClient.getStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const validateInputs = () => {
    const newErrors = {};

    if (!instrument.trim()) {
      newErrors.instrument = 'Instrument token is required';
    } else if (isNaN(parseInt(instrument))) {
      newErrors.instrument = 'Must be a valid number';
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
      Alert.alert('Validation Error', 'Please fix the errors before starting.');
      return;
    }

    Alert.alert(
      'Start Trading?',
      'Are you sure you want to start the trading bot with these parameters?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setLoading(true);
            try {
              const params = {
                instrument,
                capital: parseFloat(capital),
                timeframe,
                sl_ticks: parseInt(slTicks),
                target_ticks: parseInt(targetTicks),
                risk_per_trade_pct: parseFloat(riskPct) / 100,
              };

              if (paper) params.paper = true;
              if (notimeexit) params.notimeexit = true;

              const response = await apiClient.startTrading(params);

              if (response.success) {
                Alert.alert('Success', response.message);
                fetchStatus();
              } else {
                Alert.alert('Error', response.error || 'Failed to start trading');
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

  const handleStopTrading = async () => {
    Alert.alert(
      'Stop Trading?',
      'Are you sure you want to stop the trading bot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await apiClient.stopTrading();
              if (response.success) {
                Alert.alert('Success', response.message);
                fetchStatus();
              } else {
                Alert.alert('Error', response.error || 'Failed to stop trading');
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

  const handleRestartTrading = async () => {
    if (!validateInputs()) {
      Alert.alert('Validation Error', 'Please fix the errors before restarting.');
      return;
    }

    Alert.alert(
      'Restart Trading?',
      'This will stop the current bot and start a new one with updated parameters.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          onPress: async () => {
            setLoading(true);
            try {
              const params = {
                instrument,
                capital: parseFloat(capital),
                timeframe,
                sl_ticks: parseInt(slTicks),
                target_ticks: parseInt(targetTicks),
                risk_per_trade_pct: parseFloat(riskPct) / 100,
              };

              if (paper) params.paper = true;
              if (notimeexit) params.notimeexit = true;

              const response = await apiClient.restartTrading(params);

              if (response.success) {
                Alert.alert('Success', response.message);
                fetchStatus();
              } else {
                Alert.alert('Error', response.error || 'Failed to restart trading');
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

          <TextInput
            label="Instrument Token"
            value={instrument}
            onChangeText={setInstrument}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.instrument}
            style={styles.input}
          />
          {errors.instrument && (
            <HelperText type="error">{errors.instrument}</HelperText>
          )}
          <HelperText type="info">NIFTY BANK: 120395527, NIFTY: 256265</HelperText>

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
