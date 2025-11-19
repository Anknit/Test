import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import apiClient from '../services/api';
import { COLORS } from '../utils/constants';
import { useFocusEffect } from '@react-navigation/native';

export default function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [lines, setLines] = useState('100');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await apiClient.getLogs(
        parseInt(lines) || 100,
        filter
      );

      if (response.success && response.data) {
        setLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      Alert.alert('Error', error.message);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs(false);
  };

  const applyFilter = (filterText) => {
    setFilter(filterText);
  };

  const clearFilter = () => {
    setFilter('');
  };

  // Auto-refresh every 10 seconds
  useFocusEffect(
    useCallback(() => {
      fetchLogs();

      let interval;
      if (autoRefresh) {
        interval = setInterval(() => {
          fetchLogs(false);
        }, 10000);
      }

      return () => {
        if (interval) clearInterval(interval);
      };
    }, [autoRefresh, filter, lines])
  );

  const getLogStyle = (log) => {
    if (log.includes('[ERROR]')) return styles.errorLog;
    if (log.includes('[WARN]')) return styles.warnLog;
    if (log.includes('[INFO]')) return styles.infoLog;
    return styles.defaultLog;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Paragraph style={styles.loadingText}>Loading logs...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Controls */}
      <Card style={styles.filterCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Filters</Title>

          <View style={styles.filterRow}>
            <TextInput
              label="Search in logs"
              value={filter}
              onChangeText={setFilter}
              mode="outlined"
              placeholder="e.g., ERROR, Trading"
              style={styles.filterInput}
              right={
                filter ? (
                  <TextInput.Icon icon="close" onPress={clearFilter} />
                ) : null
              }
            />
          </View>

          <View style={styles.filterRow}>
            <TextInput
              label="Number of lines"
              value={lines}
              onChangeText={setLines}
              mode="outlined"
              keyboardType="numeric"
              placeholder="100"
              style={styles.linesInput}
            />
            <Button
              mode="contained"
              onPress={() => fetchLogs(true)}
              style={styles.applyButton}
            >
              Apply
            </Button>
          </View>

          <View style={styles.chipRow}>
            <Chip
              selected={filter === 'ERROR'}
              onPress={() => applyFilter('ERROR')}
              style={styles.chip}
            >
              Errors
            </Chip>
            <Chip
              selected={filter === 'WARN'}
              onPress={() => applyFilter('WARN')}
              style={styles.chip}
            >
              Warnings
            </Chip>
            <Chip
              selected={filter === 'INFO'}
              onPress={() => applyFilter('INFO')}
              style={styles.chip}
            >
              Info
            </Chip>
          </View>

          <View style={styles.toggleRow}>
            <Paragraph>Auto-refresh</Paragraph>
            <Button
              mode={autoRefresh ? 'contained' : 'outlined'}
              onPress={() => setAutoRefresh(!autoRefresh)}
              compact
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Logs Display */}
      <ScrollView
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.logsCard}>
          <Card.Content>
            <View style={styles.logsHeader}>
              <Title style={styles.cardTitle}>Logs ({logs.length})</Title>
              <Button
                mode="text"
                onPress={onRefresh}
                compact
                icon="refresh"
              >
                Refresh
              </Button>
            </View>

            {logs.length === 0 ? (
              <Paragraph style={styles.noLogs}>No logs found</Paragraph>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={[styles.logLine, getLogStyle(log)]}>
                  <Paragraph style={styles.logText}>{log}</Paragraph>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Paragraph style={styles.footerText}>
            Last updated: {new Date().toLocaleTimeString()}
          </Paragraph>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  filterCard: {
    margin: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterInput: {
    flex: 1,
  },
  linesInput: {
    flex: 1,
    marginRight: 10,
  },
  applyButton: {
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logsContainer: {
    flex: 1,
  },
  logsCard: {
    margin: 10,
    elevation: 2,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noLogs: {
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    padding: 20,
  },
  logLine: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 2,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  defaultLog: {
    backgroundColor: '#f9f9f9',
    borderLeftColor: COLORS.BORDER,
  },
  infoLog: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: COLORS.INFO,
  },
  warnLog: {
    backgroundColor: '#fff3e0',
    borderLeftColor: COLORS.WARNING,
  },
  errorLog: {
    backgroundColor: '#ffebee',
    borderLeftColor: COLORS.ERROR,
  },
  logText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLORS.TEXT_PRIMARY,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
});
