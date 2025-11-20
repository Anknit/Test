/**
 * Security Middleware and Utilities
 * Comprehensive security implementation for Kite Trading Bot
 */

const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Generate a secure API key
 * @returns {string} 32-byte hex API key
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get or create API key
 * @returns {string} API key from environment or newly generated
 */
function getApiKey() {
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }

  // Generate new API key
  const apiKey = generateApiKey();
  console.log('\n' + '='.repeat(70));
  console.log('🔐 API KEY GENERATED');
  console.log('='.repeat(70));
  console.log(`API Key: ${apiKey}`);
  console.log('\nAdd this to your .env file:');
  console.log(`API_KEY=${apiKey}`);
  console.log('\nInclude in API requests:');
  console.log(`  curl -H "X-API-Key: ${apiKey}" http://localhost:3000/api/status`);
  console.log('='.repeat(70) + '\n');

  return apiKey;
}

/**
 * API Key Authentication Middleware
 * Validates API key in X-API-Key header or api_key query parameter
 */
function requireAuth(req, res, next) {
  // Skip auth in development if explicitly disabled
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const expectedKey = getApiKey();

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. API key required in X-API-Key header or api_key query parameter.'
    });
  }

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(expectedKey))) {
    logSecurityEvent('AUTH_FAILED', req.ip, { apiKey: sanitizeApiKey(apiKey) });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Invalid API key.'
    });
  }

  next();
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Rate limiter for login attempts
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_LOGIN', req.ip);
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
});

/**
 * Rate limiter for general API requests
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_API', req.ip);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.'
    });
  }
});

/**
 * Rate limiter for backtest operations (resource-intensive)
 */
const backtestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 backtests per 5 minutes
  message: {
    success: false,
    error: 'Too many backtest requests. Please wait before running another backtest.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// HTTPS ENFORCEMENT
// ============================================

/**
 * Middleware to enforce HTTPS in production
 */
function enforceHttps(req, res, next) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_HTTP !== 'true') {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.status(403).json({
        success: false,
        error: 'HTTPS required. Please use https:// instead of http://'
      });
    }
  }
  next();
}

/**
 * Log warning about HTTP usage on startup
 */
function checkHttpsWarning() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_HTTP === 'true') {
    console.log('\n' + '⚠️ '.repeat(35));
    console.log('⚠️  WARNING: HTTPS IS DISABLED IN PRODUCTION  ⚠️');
    console.log('⚠️  Credentials will be transmitted in PLAIN TEXT  ⚠️');
    console.log('⚠️  This is HIGHLY INSECURE for production use  ⚠️');
    console.log('⚠️  Enable HTTPS or set ALLOW_HTTP=false  ⚠️');
    console.log('⚠️ '.repeat(35) + '\n');
  }
}

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Validate trading parameters
 * @param {Object} params - Trading parameters
 * @returns {Object} Validated parameters
 * @throws {Error} If validation fails
 */
function validateTradingParams(params) {
  const validated = {};

  // Validate tradingsymbol (alphanumeric and common symbols only)
  if (!params.tradingsymbol) {
    throw new Error('Trading symbol is required.');
  }
  if (typeof params.tradingsymbol !== 'string') {
    throw new Error('Invalid trading symbol. Must be a string.');
  }
  if (params.tradingsymbol.length > 50) {
    throw new Error('Trading symbol too long. Maximum 50 characters.');
  }
  validated.tradingsymbol = params.tradingsymbol;

  // Validate numeric parameters
  const numericParams = ['capital', 'timeframe', 'slTicks', 'targetTicks', 'riskPercent'];
  numericParams.forEach(param => {
    if (params[param] !== undefined) {
      const value = parseFloat(params[param]);
      if (isNaN(value) || value < 0) {
        throw new Error(`Invalid ${param}. Must be a positive number.`);
      }
      validated[param] = value;
    }
  });

  // Boolean flags only
  validated.paper = params.paper === true || params.paper === 'true';
  validated.notimeexit = params.notimeexit === true || params.notimeexit === 'true';

  // NEVER allow direct args array from user (command injection risk)
  // validated.args = params.args; // EXPLICITLY REMOVED

  return validated;
}

/**
 * Validate user credentials
 * @param {Object} credentials - Login credentials
 * @returns {Object} Validated credentials
 * @throws {Error} If validation fails
 */
function validateCredentials(credentials) {
  const { userId, password, totp } = credentials;

  // Validate userId format (should be like AB1234)
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID is required.');
  }
  if (!/^[A-Z]{2}\d{4,6}$/.test(userId)) {
    throw new Error('Invalid user ID format. Should be like AB1234.');
  }

  // Validate password exists
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required.');
  }
  if (password.length < 1 || password.length > 100) {
    throw new Error('Invalid password length.');
  }

  // Validate TOTP (should be 6 digits)
  if (!totp || typeof totp !== 'string') {
    throw new Error('2FA code is required.');
  }
  if (!/^\d{6}$/.test(totp)) {
    throw new Error('Invalid 2FA code format. Should be 6 digits.');
  }

  return { userId, password, totp };
}

/**
 * Validate email configuration
 * @param {Object} config - Email configuration
 * @returns {Object} Validated configuration
 * @throws {Error} If validation fails
 */
function validateEmailConfig(config) {
  const { host, port, user, pass, to } = config;

  if (!host || typeof host !== 'string' || host.length > 100) {
    throw new Error('Invalid email host.');
  }

  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error('Invalid email port. Must be between 1 and 65535.');
  }

  if (!user || typeof user !== 'string' || !user.includes('@')) {
    throw new Error('Invalid email user. Must be a valid email address.');
  }

  if (!pass || typeof pass !== 'string' || pass.length < 1) {
    throw new Error('Invalid email password.');
  }

  if (!to || typeof to !== 'string' || !to.includes('@')) {
    throw new Error('Invalid recipient email address.');
  }

  return { host, port: portNum, user, pass, to };
}

// ============================================
// PATH TRAVERSAL PREVENTION
// ============================================

const path = require('path');

/**
 * Check if a path is safe (within allowed directory)
 * @param {string} basePath - Base directory
 * @param {string} userPath - User-provided path
 * @returns {boolean} True if path is safe
 */
function isSafePath(basePath, userPath) {
  const resolvedBase = path.resolve(basePath);
  const resolvedUser = path.resolve(basePath, userPath);

  // Ensure resolved path starts with base directory
  return resolvedUser.startsWith(resolvedBase + path.sep) || resolvedUser === resolvedBase;
}

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - User-provided filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  // Remove path separators and parent directory references
  return filename
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/^\.+/, '')
    .substring(0, 255); // Limit length
}

// ============================================
// DATA SANITIZATION
// ============================================

/**
 * Sanitize data for logging (hide sensitive information)
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
function sanitizeForLog(data) {
  if (typeof data === 'string') {
    // If looks like a token/password (long string), truncate
    if (data.length > 20 && !data.includes(' ')) {
      return `${data.substring(0, 6)}...${data.substring(data.length - 4)}`;
    }
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Hide sensitive fields
      if (/password|token|secret|key|pass/i.test(key)) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Sanitize API key for display (show first/last 4 chars only)
 * @param {string} apiKey - API key
 * @returns {string} Sanitized API key
 */
function sanitizeApiKey(apiKey) {
  if (!apiKey || apiKey.length < 10) return '***';
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} unsafe - Unsafe string
 * @returns {string} Escaped string
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Configure Helmet security headers
 * @returns {Function} Helmet middleware
 */
function configureHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  });
}

/**
 * Configure CORS
 * @returns {Function} CORS middleware
 */
function configureCors() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8081'];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    maxAge: 86400 // 24 hours
  });
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Safe error response (hides details in production)
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 */
function sendErrorResponse(err, res, statusCode = 500) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log full error for debugging
  console.error('[ERROR]', err.message);
  if (isDevelopment) {
    console.error(err.stack);
  }

  // Send sanitized response
  res.status(statusCode).json({
    success: false,
    error: isDevelopment
      ? err.message
      : 'Internal server error. Check server logs for details.'
  });
}

// ============================================
// SECURITY LOGGING
// ============================================

const fs = require('fs');
const dayjs = require('dayjs');

/**
 * Log security events
 * @param {string} event - Event type
 * @param {string} ip - IP address
 * @param {Object} metadata - Additional metadata
 */
function logSecurityEvent(event, ip, metadata = {}) {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] [SECURITY] ${event} from ${ip} ${JSON.stringify(metadata)}\n`;

  console.log(logMessage.trim());

  try {
    const logFile = path.join(__dirname, 'logs', 'security.log');
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error('Failed to write security log:', err.message);
  }
}

// ============================================
// FILE PERMISSIONS
// ============================================

/**
 * Ensure file has secure permissions (600)
 * @param {string} filepath - Path to file
 */
function ensureSecurePermissions(filepath) {
  if (fs.existsSync(filepath)) {
    try {
      const stats = fs.statSync(filepath);
      const mode = stats.mode & parseInt('777', 8);

      // Check if permissions are too open (not 600)
      if (mode !== parseInt('600', 8)) {
        console.log(`⚠️  WARNING: ${filepath} has insecure permissions (${mode.toString(8)}). Setting to 600.`);
        fs.chmodSync(filepath, 0o600);
        console.log(`✅ Fixed permissions for ${filepath}`);
      }
    } catch (err) {
      console.error(`Failed to check/fix permissions for ${filepath}:`, err.message);
    }
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Authentication
  getApiKey,
  generateApiKey,
  requireAuth,

  // Rate Limiting
  loginLimiter,
  apiLimiter,
  backtestLimiter,

  // HTTPS
  enforceHttps,
  checkHttpsWarning,

  // Input Validation
  validateTradingParams,
  validateCredentials,
  validateEmailConfig,

  // Path Security
  isSafePath,
  sanitizeFilename,

  // Data Sanitization
  sanitizeForLog,
  sanitizeApiKey,
  escapeHtml,

  // Security Headers
  configureHelmet,
  configureCors,

  // Error Handling
  sendErrorResponse,

  // Logging
  logSecurityEvent,

  // File Permissions
  ensureSecurePermissions,
};
