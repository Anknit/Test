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
  Badge,
  ActivityIndicator,
  Button,
  Divider,
} from 'react-native-paper';
import apiClient from '../services/api';
import { COLORS, TRADING_STATUS, REFRESH_INTERVALS } from '../utils/constants';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enctokenValid, setEnctokenValid] = useState(true);

  const fetchStatus = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Fetch trading status
      const statusData = await apiClient.getStatus();
      setStatus(statusData.data);

      // Check enctoken validity
      const enctokenData = await apiClient.validateEnctoken();
      setEnctokenValid(enctokenData.data?.valid || false);

    } catch (error) {
      console.error('Error fetching status:', error);
      Alert.alert('Error', error.message);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus(false);
  };

  // Auto-refresh every 5 seconds
  useFocusEffect(
    useCallback(() => {
      fetchStatus();

      const interval = setInterval(() => {
        fetchStatus(false);
      }, REFRESH_INTERVALS.STATUS);

      return () => clearInterval(interval);
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Paragraph style={styles.loadingText}>Loading status...</Paragraph>
      </View>
    );
  }

  const isRunning = status?.trading === TRADING_STATUS.RUNNING;
  const statusColor = isRunning ? COLORS.SUCCESS : COLORS.ERROR;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Enctoken Warning */}
      {!enctokenValid && (
        <Card style={[styles.card, styles.warningCard]}>
          <Card.Content>
            <Title style={styles.warningTitle}>⚠️ Enctoken Expired</Title>
            <Paragraph>Your Kite enctoken has expired. Please login again in Settings.</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Trading Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Title style={styles.cardTitle}>Trading Status</Title>
            <Badge
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              {status?.trading || 'Unknown'}
            </Badge>
          </View>
          <Divider style={styles.divider} />

          {status?.process && (
            <>
              <View style={styles.row}>
                <Paragraph style={styles.label}>Process ID:</Paragraph>
                <Paragraph style={styles.value}>{status.process.pid}</Paragraph>
              </View>
              <View style={styles.row}>
                <Paragraph style={styles.label}>Uptime:</Paragraph>
                <Paragraph style={styles.value}>{status.process.uptime}</Paragraph>
              </View>
              <View style={styles.row}>
                <Paragraph style={styles.label}>Memory:</Paragraph>
                <Paragraph style={styles.value}>{status.process.memory}</Paragraph>
              </View>
            </>
          )}

          {!isRunning && (
            <Paragraph style={styles.infoText}>
              Trading bot is not running. Start it from the Trading tab.
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* System Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>System Info</Title>
          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Paragraph style={styles.label}>Server:</Paragraph>
            <Paragraph style={styles.value}>
              {status?.server?.hostname || 'Unknown'}
            </Paragraph>
          </View>
          <View style={styles.row}>
            <Paragraph style={styles.label}>Platform:</Paragraph>
            <Paragraph style={styles.value}>
              {status?.server?.platform || 'Unknown'}
            </Paragraph>
          </View>
          <View style={styles.row}>
            <Paragraph style={styles.label}>Uptime:</Paragraph>
            <Paragraph style={styles.value}>
              {status?.server?.uptime || 'Unknown'}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* Enctoken Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Enctoken Status</Title>
          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Paragraph style={styles.label}>Status:</Paragraph>
            <Badge
              style={[
                styles.badge,
                { backgroundColor: enctokenValid ? COLORS.SUCCESS : COLORS.ERROR }
              ]}
            >
              {enctokenValid ? 'Valid' : 'Expired'}
            </Badge>
          </View>

          {!enctokenValid && (
            <Button
              mode="contained"
              onPress={() => {
                Alert.alert(
                  'Enctoken Expired',
                  'Please login again using the Settings screen.',
                  [{ text: 'OK' }]
                );
              }}
              style={styles.loginButton}
            >
              Login Required
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Cache Info */}
      {status?.cache && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Cache</Title>
            <Divider style={styles.divider} />

            <View style={styles.row}>
              <Paragraph style={styles.label}>Files:</Paragraph>
              <Paragraph style={styles.value}>{status.cache.fileCount}</Paragraph>
            </View>
            <View style={styles.row}>
              <Paragraph style={styles.label}>Size:</Paragraph>
              <Paragraph style={styles.value}>{status.cache.totalSize}</Paragraph>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.footer}>
        <Paragraph style={styles.footerText}>
          Last updated: {new Date().toLocaleTimeString()}
        </Paragraph>
      </View>
    </ScrollView>
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
  card: {
    margin: 10,
    elevation: 2,
  },
  warningCard: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.WARNING,
  },
  warningTitle: {
    color: '#856404',
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
  },
  divider: {
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
  },
  value: {
    fontWeight: '500',
    fontSize: 14,
  },
  infoText: {
    marginTop: 10,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  loginButton: {
    marginTop: 10,
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
