/**
 * Centralized Constants Configuration
 * All configuration constants for Kite Trading Bot
 */

const path = require('path');

// ============================================
// SERVER CONFIGURATION
// ============================================

const SERVER = {
  PORT: process.env.PORT || 3000,
  HOST: '0.0.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  ALLOW_HTTP: process.env.ALLOW_HTTP === 'true',
};

// ============================================
// FILE PATHS
// ============================================

const PATHS = {
  LOG_DIR: path.join(__dirname, 'logs'),
  SUPERVISOR_LOG: path.join(__dirname, 'logs', 'supervisor.log'),
  ENCTOKEN_FILE: path.join(__dirname, '.env.enctoken'),
  ENCTOKEN_BACKUP_DIR: path.join(__dirname, 'enctoken_backups'),
  EMAIL_CONFIG_FILE: path.join(__dirname, '.env.email'),
  CACHE_DIR: path.join(__dirname, 'cache'),
  PUBLIC_DIR: path.join(__dirname, 'public'),
  BACKTEST_RESULTS_FILE: path.join(__dirname, 'backtest_results.json'),
};

// ============================================
// VALIDATION RULES
// ============================================

const VALIDATION = {
  ENCTOKEN_MIN_LENGTH: 50,
  USER_ID_PATTERN: /^[A-Z]{2}\d{4,6}$/,
  TOTP_PATTERN: /^\d{6}$/,
  TRADING_SYMBOL_PATTERN: /^[A-Z0-9]+$/,
};

// ============================================
// MARKET CONFIGURATION
// ============================================

const MARKET = {
  OPEN_TIME: '09:15',
  CLOSE_TIME: '23:30',
  TIMEZONE: 'Asia/Kolkata',
  NO_ENTRY_BEFORE_CLOSE_MIN: 30,
};

// ============================================
// TRADING DEFAULTS
// ============================================

const TRADING_DEFAULTS = {
  CAPITAL: 450000,
  TIMEFRAME: 3,
  SL_TICKS: 30,
  TARGET_TICKS: 70,
  RISK_PER_TRADE_PCT: 0.014,
  MAX_HOLD_CANDLES: 60,
  DAYS_HISTORY: 10,
};

// ============================================
// KITE API ENDPOINTS
// ============================================

const KITE_API = {
  BASE_URL: 'https://kite.zerodha.com',
  LOGIN: 'https://kite.zerodha.com/api/login',
  TWOFA: 'https://kite.zerodha.com/api/twofa',
  USER_PROFILE: 'https://kite.zerodha.com/oms/user/profile',
  ORDERS: 'https://kite.zerodha.com/oms/orders/regular',
  ORDERS_FETCH: 'https://kite.zerodha.com/oms/orders',
  POSITIONS: 'https://kite.zerodha.com/oms/portfolio/positions',
  HISTORICAL: 'https://kite.zerodha.com/oms/instruments/historical',
  INSTRUMENTS_CSV: 'https://kite.zerodha.com/instruments',
};

// ============================================
// HTTP HEADERS
// ============================================

const HEADERS = {
  KITE_VERSION: '3',
  USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_FORM: 'application/x-www-form-urlencoded',
};

// ============================================
// TIMEOUTS & INTERVALS
// ============================================

const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  KITE_LOGIN: 10000, // 10 seconds
  ENCTOKEN_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  CACHE_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  STATUS_REFRESH_INTERVAL: 5000, // 5 seconds
  EMAIL_ALERT_INTERVAL: 5 * 60 * 1000, // 5 minutes (for recurring alerts)
};

// ============================================
// CACHE CONFIGURATION
// ============================================

const CACHE = {
  MAX_AGE_HOURS: 24,
  FILE_PREFIX: 'historical_',
  COMPRESSION: false,
};

// ============================================
// EMAIL CONFIGURATION
// ============================================

const EMAIL = {
  DEFAULT_PORT: 587,
  SSL_PORT: 465,
  TIMEOUT: 10000,
  SUBJECT_PREFIX: '🤖 Kite Trading Bot: ',
};

// ============================================
// RATE LIMITING
// ============================================

const RATE_LIMITS = {
  LOGIN: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 5,
  },
  API_GENERAL: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
  },
  BACKTEST: {
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    MAX_REQUESTS: 3,
  },
};

// ============================================
// LOGGING
// ============================================

const LOGGING = {
  LEVELS: {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    SUCCESS: 'SUCCESS',
  },
  DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  MAX_LOG_LINES: 10000,
};

// ============================================
// SECURITY
// ============================================

const SECURITY = {
  FILE_PERMISSIONS: 0o600, // Owner read/write only
  BCRYPT_ROUNDS: 10,
  JWT_EXPIRY: '24h',
  API_KEY_LENGTH: 32,
  MAX_JSON_SIZE: '10mb',
  MAX_LOGIN_SIZE: '1kb',
};

// ============================================
// TECHNICAL INDICATORS
// ============================================

const INDICATORS = {
  EMA_FAST: 12,
  EMA_SLOW: 26,
  MACD_SIGNAL: 9,
  RSI_PERIOD: 14,
  ATR_PERIOD: 14,
  RSI_OVERSOLD: 30,
  RSI_OVERBOUGHT: 70,
};

// ============================================
// BROWSER AUTOMATION (for enctoken extraction)
// ============================================

const BROWSER = {
  HEADLESS: true,
  TIMEOUT: 30000,
  VIEWPORT: { width: 1280, height: 720 },
  USER_DATA_DIR_PREFIX: 'chrome-profile-',
};

// ============================================
// HTTP STATUS CODES
// ============================================

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================
// API RESPONSE MESSAGES
// ============================================

const MESSAGES = {
  SUCCESS: {
    TRADING_STARTED: 'Trading started successfully',
    TRADING_STOPPED: 'Trading stopped successfully',
    ENCTOKEN_UPDATED: 'Enctoken updated successfully',
    LOGIN_SUCCESS: 'Login successful, enctoken updated',
    EMAIL_SENT: 'Email sent successfully',
    CACHE_CLEARED: 'Cache cleared successfully',
    BACKTEST_COMPLETE: 'Backtest completed successfully',
    PARAMS_SAVED: 'Parameters saved successfully',
  },
  ERROR: {
    TRADING_ALREADY_RUNNING: 'Trading process already running',
    NO_PROCESS_RUNNING: 'No trading process is currently running',
    INVALID_ENCTOKEN: 'Invalid or missing enctoken',
    MISSING_CREDENTIALS: 'userId, password, and totp are required',
    INVALID_USER_ID: 'Invalid userId format. Should be like AB1234',
    INVALID_TOTP: 'Invalid TOTP format. Should be 6 digits',
    LOGIN_FAILED: 'Login failed',
    NO_EMAIL_CONFIG: 'Email not configured',
    NO_BACKTEST_RESULTS: 'No backtest results found',
    CACHE_NOT_FOUND: 'Cache directory not found',
    INVALID_INSTRUMENT: 'Invalid instrument token',
    UNAUTHORIZED: 'Unauthorized. API key required.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down.',
  },
};

// ============================================
// PROCESS STATES
// ============================================

const PROCESS_STATES = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error',
  RESTARTING: 'restarting',
};

// ============================================
// ENCTOKEN STATES
// ============================================

const ENCTOKEN_STATES = {
  VALID: 'valid',
  INVALID: 'invalid',
  MISSING: 'missing',
  EXPIRED: 'expired',
};

// ============================================
// EXPORT ALL CONSTANTS
// ============================================

module.exports = {
  SERVER,
  PATHS,
  VALIDATION,
  MARKET,
  TRADING_DEFAULTS,
  KITE_API,
  HEADERS,
  TIMEOUTS,
  CACHE,
  EMAIL,
  RATE_LIMITS,
  LOGGING,
  SECURITY,
  INDICATORS,
  BROWSER,
  HTTP_STATUS,
  MESSAGES,
  PROCESS_STATES,
  ENCTOKEN_STATES,
};
