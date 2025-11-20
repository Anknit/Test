/**
 * App Constants
 */

export const APP_NAME = 'Kite Trading Bot';
export const APP_VERSION = '2.0.0';

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  STATUS: '/api/status',
  TRADING_START: '/api/trading/start',
  TRADING_STOP: '/api/trading/stop',
  TRADING_RESTART: '/api/trading/restart',
  ENCTOKEN_UPDATE: '/api/enctoken/update',
  ENCTOKEN_STATUS: '/api/enctoken/status',
  ENCTOKEN_LOGIN: '/api/enctoken/login',
  ENCTOKEN_VALIDATE: '/api/enctoken/validate',
  LOGS: '/api/logs',
  LOGS_DOWNLOAD: '/api/logs/download',
  LOGS_CLEAR: '/api/logs/clear',
  BACKTEST_RUN: '/api/backtest/run',
  BACKTEST_RESULTS: '/api/backtest/results',
  CACHE: '/api/cache',
  CACHE_CLEAR: '/api/cache/clear',
  INSTRUMENTS: '/api/instruments',
  EMAIL_CONFIG: '/api/email/config',
  EMAIL_STATUS: '/api/email/status',
  EMAIL_TEST: '/api/email/test',
  POSITIONS: '/api/positions',
};

// Status
export const TRADING_STATUS = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  RESTARTING: 'restarting',
};

// Colors
export const COLORS = {
  PRIMARY: '#4CAF50',
  SECONDARY: '#2196F3',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  SUCCESS: '#4CAF50',
  INFO: '#2196F3',
  BACKGROUND: '#f5f5f5',
  CARD_BACKGROUND: '#ffffff',
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#757575',
  BORDER: '#e0e0e0',
};

// Timeframes
export const TIMEFRAMES = [
  { label: '3 minute', value: '3' },
  { label: '5 minute', value: '5' },
  { label: '15 minute', value: '15' },
  { label: '30 minute', value: '30' },
  { label: '1 hour', value: '60' },
];

// Refresh intervals (milliseconds)
export const REFRESH_INTERVALS = {
  STATUS: 5000,           // 5 seconds
  LOGS: 10000,            // 10 seconds
  ENCTOKEN_CHECK: 300000, // 5 minutes
};

// Default trading parameters
export const DEFAULT_PARAMS = {
  CAPITAL: 450000,
  TIMEFRAME: '3',
  SL_TICKS: 30,
  TARGET_TICKS: 70,
  RISK_PCT: 0.014,
};
