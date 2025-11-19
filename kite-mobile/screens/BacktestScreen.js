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

  // Backtest parameters
  const [instrument, setInstrument] = useState('120395527');
  const [capital, setCapital] = useState(DEFAULT_PARAMS.CAPITAL.toString());
  const [timeframe, setTimeframe] = useState(DEFAULT_PARAMS.TIMEFRAME);
  const [slTicks, setSlTicks] = useState(DEFAULT_PARAMS.SL_TICKS.toString());
  const [targetTicks, setTargetTicks] = useState(DEFAULT_PARAMS.TARGET_TICKS.toString());
  const [riskPct, setRiskPct] = useState((DEFAULT_PARAMS.RISK_PCT * 100).toString());

  const [errors, setErrors] = useState({});

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

  const handleRunBacktest = async () => {
    if (!validateInputs()) {
      Alert.alert('Validation Error', 'Please fix the errors before running backtest.');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const params = {
        instrument,
        capital: parseFloat(capital),
        timeframe,
        sl_ticks: parseInt(slTicks),
        target_ticks: parseInt(targetTicks),
        risk_per_trade_pct: parseFloat(riskPct) / 100,
        notimeexit: true, // Backtest typically doesn't have time exit
      };

      const response = await apiClient.runBacktest(params);

      if (response.success) {
        Alert.alert('Success', 'Backtest completed successfully!');
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
        Alert.alert('Error', response.error || 'Backtest failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
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
              <Paragraph style={styles.resultValue}>{results.totalTrades || 'N/A'}</Paragraph>
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
