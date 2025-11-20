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
  Paragraph,
  HelperText,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../services/api';
import { COLORS, TIMEFRAMES, DEFAULT_PARAMS } from '../utils/constants';

export default function BacktestScreen() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [instruments, setInstruments] = useState([]);

  // Backtest parameters
  const [tradingsymbol, setTradingsymbol] = useState('');
  const [capital, setCapital] = useState(DEFAULT_PARAMS.CAPITAL.toString());
  const [timeframe, setTimeframe] = useState(DEFAULT_PARAMS.TIMEFRAME);
  const [slTicks, setSlTicks] = useState(DEFAULT_PARAMS.SL_TICKS.toString());
  const [targetTicks, setTargetTicks] = useState(DEFAULT_PARAMS.TARGET_TICKS.toString());
  const [riskPct, setRiskPct] = useState((DEFAULT_PARAMS.RISK_PCT * 100).toString());

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInstruments();
  }, []);

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

  const handleRunBacktest = async () => {
    if (!validateInputs()) {
      if (Platform.OS === 'web') {
        window.alert('Validation Error: Please fix the errors before running backtest.');
      } else {
        Alert.alert('Validation Error', 'Please fix the errors before running backtest.');
      }
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const params = {
        tradingsymbol,
        capital: parseFloat(capital),
        timeframe,
        slTicks: parseInt(slTicks),
        targetTicks: parseInt(targetTicks),
        riskPercent: parseFloat(riskPct) / 100,
        notimeexit: true, // Backtest typically doesn't have time exit
      };

      const response = await apiClient.runBacktest(params);

      if (response.success) {
        if (Platform.OS === 'web') {
          window.alert('Success: Backtest completed successfully!');
        } else {
          Alert.alert('Success', 'Backtest completed successfully!');
        }
        // Try to fetch results
        try {
          const resultsData = await apiClient.getBacktestResults();
          if (resultsData.success) {
            setResults(resultsData.data);
          }
        } catch (err) {
          console.error('Error fetching results:', err);
        }
      } else {
        const errorMessage = response.error || 'Backtest failed';
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

  return (
    <ScrollView style={styles.container}>
      {/* Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>ℹ️ About Backtest</Title>
          <Divider style={styles.divider} />
          <Paragraph>
            Backtest runs your trading strategy on historical data to evaluate performance.
            This helps optimize parameters before live trading.
          </Paragraph>
          <Paragraph style={styles.note}>
            Note: Backtesting may take a few minutes to complete.
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Parameters Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Backtest Parameters</Title>
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

          <Button
            mode="contained"
            onPress={handleRunBacktest}
            loading={loading}
            disabled={loading}
            style={styles.button}
            icon="chart-line"
          >
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
        </Card.Content>
      </Card>

      {/* Results Card */}
      {results && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Backtest Results</Title>
            <Divider style={styles.divider} />

            <View style={styles.resultRow}>
              <Paragraph style={styles.resultLabel}>Total Trades:</Paragraph>
              <Paragraph style={styles.resultValue}>{results.trades || 'N/A'}</Paragraph>
            </View>

            <View style={styles.resultRow}>
              <Paragraph style={styles.resultLabel}>Winning Trades:</Paragraph>
              <Paragraph style={[styles.resultValue, { color: COLORS.SUCCESS }]}>
                {results.winningTrades || 'N/A'}
              </Paragraph>
            </View>

            <View style={styles.resultRow}>
              <Paragraph style={styles.resultLabel}>Losing Trades:</Paragraph>
              <Paragraph style={[styles.resultValue, { color: COLORS.ERROR }]}>
                {results.losingTrades || 'N/A'}
              </Paragraph>
            </View>

            <View style={styles.resultRow}>
              <Paragraph style={styles.resultLabel}>Win Rate:</Paragraph>
              <Paragraph style={styles.resultValue}>
                {results.winRate ? `${results.winRate}%` : 'N/A'}
              </Paragraph>
            </View>

            <View style={styles.resultRow}>
              <Paragraph style={styles.resultLabel}>Total P&L:</Paragraph>
              <Paragraph style={[
                styles.resultValue,
                { color: (results.totalPnL || 0) >= 0 ? COLORS.SUCCESS : COLORS.ERROR, fontWeight: 'bold' }
              ]}>
                ₹{results.totalPnL?.toFixed(2) || '0.00'}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Paragraph style={styles.loadingText}>Running backtest...</Paragraph>
        </View>
      )}
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
  note: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
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
  button: {
    marginTop: 15,
    paddingVertical: 6,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.TEXT_SECONDARY,
  },
});
