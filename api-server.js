#!/usr/bin/env node

// Load environment variables first
require('dotenv').config();

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Import security middleware
const security = require('./security');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Disable X-Powered-By header
app.disable('x-powered-by');

// Security headers (Helmet)
app.use(security.configureHelmet());

// CORS configuration
app.use(security.configureCors());

// HTTPS enforcement in production
app.use(security.enforceHttps);

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes rate limiting (will be applied to specific endpoints below)
// Applied after static files so assets aren't rate-limited

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 3000;
const LOG_DIR = path.join(__dirname, 'logs');
const SUPERVISOR_LOG = path.join(LOG_DIR, 'supervisor.log');
const SECURITY_LOG = path.join(LOG_DIR, 'security.log');
const ENCTOKEN_FILE = path.join(__dirname, '.env.enctoken');
const ENCTOKEN_BACKUP_DIR = path.join(__dirname, 'enctoken_backups');
const EMAIL_CONFIG_FILE = path.join(__dirname, '.env.email');

// Ensure directories exist
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(ENCTOKEN_BACKUP_DIR)) fs.mkdirSync(ENCTOKEN_BACKUP_DIR, { recursive: true });

// Ensure secure file permissions on startup
security.ensureSecurePermissions(ENCTOKEN_FILE);
security.ensureSecurePermissions(EMAIL_CONFIG_FILE);

// Global state
let tradingProcess = null;
let processStartTime = null;
let processRestartCount = 0;
let lastRestartTime = null;

// Logger (with sanitization for sensitive data)
function log(message, level = 'INFO', sanitize = true) {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

  // Sanitize message to hide sensitive data
  const safeMessage = sanitize ? security.sanitizeForLog(message) : message;
  const logMessage = `[${timestamp}] [${level}] ${safeMessage}\n`;

  console.log(logMessage.trim());

  try {
    fs.appendFileSync(SUPERVISOR_LOG, logMessage);
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

// Validate enctoken
function validateEnctoken(token) {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 50) return false;
  return true;
}

// Get enctoken from file
function getEnctoken() {
  try {
    if (!fs.existsSync(ENCTOKEN_FILE)) return null;
    const content = fs.readFileSync(ENCTOKEN_FILE, 'utf8');
    const match = content.match(/ENCTOKEN="([^"]+)"/);
    return match ? match[1] : null;
  } catch (err) {
    log(`Error reading enctoken: ${err.message}`, 'ERROR');
    return null;
  }
}

// Get email configuration
function getEmailConfig() {
  try {
    if (!fs.existsSync(EMAIL_CONFIG_FILE)) return null;
    const content = fs.readFileSync(EMAIL_CONFIG_FILE, 'utf8');
    const config = {};

    const hostMatch = content.match(/EMAIL_HOST="([^"]+)"/);
    const portMatch = content.match(/EMAIL_PORT="([^"]+)"/);
    const userMatch = content.match(/EMAIL_USER="([^"]+)"/);
    const passMatch = content.match(/EMAIL_PASS="([^"]+)"/);
    const toMatch = content.match(/EMAIL_TO="([^"]+)"/);

    if (hostMatch) config.host = hostMatch[1];
    if (portMatch) config.port = parseInt(portMatch[1]);
    if (userMatch) config.user = userMatch[1];
    if (passMatch) config.pass = passMatch[1];
    if (toMatch) config.to = toMatch[1];

    return (config.host && config.user && config.pass && config.to) ? config : null;
  } catch (err) {
    log(`Error reading email config: ${err.message}`, 'ERROR');
    return null;
  }
}

// Send email alert
async function sendEmailAlert(subject, message) {
  const emailConfig = getEmailConfig();

  if (!emailConfig) {
    log('Email alert skipped: No email configuration found', 'WARN');
    return { success: false, error: 'No email configuration' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port || 587,
      secure: emailConfig.port === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    });

    const info = await transporter.sendMail({
      from: emailConfig.user,
      to: emailConfig.to,
      subject: `🤖 Kite Trading Bot: ${subject}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b35;">🤖 Kite Trading Bot Alert</h2>
          <h3>${subject}</h3>
          <p style="white-space: pre-wrap;">${message}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated alert from your Kite Trading Bot.<br>
            Timestamp: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    log(`Email alert sent: ${subject}`, 'INFO');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    log(`Failed to send email alert: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

// Validate enctoken with Kite API
async function validateEnctokenWithAPI(enctoken) {
  if (!validateEnctoken(enctoken)) {
    return { valid: false, error: 'Invalid enctoken format' };
  }

  try {
    // Try to fetch user profile to validate enctoken
    const response = await axios.get('https://kite.zerodha.com/oms/user/profile', {
      headers: {
        'Authorization': `enctoken ${enctoken}`,
        'X-Kite-Version': '3',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data.status === 'success') {
      return {
        valid: true,
        user: response.data.data.user_id,
        userName: response.data.data.user_name,
        email: response.data.data.email
      };
    }

    return { valid: false, error: 'Invalid response from Kite' };
  } catch (err) {
    // 403 means unauthorized (expired/invalid token)
    if (err.response?.status === 403) {
      return { valid: false, error: 'Enctoken is expired or invalid' };
    }

    // Network or other errors
    return { valid: false, error: err.message };
  }
}

// Start trading process
function startTradingProcess(args = []) {
  if (tradingProcess) {
    return { success: false, message: 'Trading process already running' };
  }

  const enctoken = getEnctoken();
  if (!validateEnctoken(enctoken)) {
    return { success: false, message: 'Invalid or missing enctoken' };
  }

  log('Starting trading process...', 'INFO');

  try {
    tradingProcess = spawn('node', ['kite.js', ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ENCTOKEN: enctoken }
    });

    processStartTime = new Date();

    tradingProcess.stdout.on('data', (data) => {
      const output = data.toString();
      log(`[TRADING] ${output.trim()}`, 'INFO');
    });

    tradingProcess.stderr.on('data', (data) => {
      const output = data.toString();
      log(`[TRADING] ${output.trim()}`, 'ERROR');
    });

    tradingProcess.on('exit', (code, signal) => {
      log(`Trading process exited: code=${code}, signal=${signal}`, 'WARN');
      tradingProcess = null;
      processStartTime = null;

      if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
        processRestartCount++;
        lastRestartTime = new Date();
      }
    });

    tradingProcess.on('error', (err) => {
      log(`Failed to start trading process: ${err.message}`, 'ERROR');
      tradingProcess = null;
      processStartTime = null;
    });

    return { success: true, message: 'Trading process started', pid: tradingProcess.pid };
  } catch (err) {
    log(`Error starting process: ${err.message}`, 'ERROR');
    return { success: false, message: err.message };
  }
}

// Stop trading process
function stopTradingProcess() {
  if (!tradingProcess) {
    return { success: false, message: 'No trading process running' };
  }

  log('Stopping trading process...', 'INFO');

  try {
    tradingProcess.kill('SIGTERM');

    // Force kill after 10 seconds if not stopped
    setTimeout(() => {
      if (tradingProcess) {
        log('Force killing trading process', 'WARN');
        tradingProcess.kill('SIGKILL');
      }
    }, 10000);

    return { success: true, message: 'Trading process stop signal sent' };
  } catch (err) {
    log(`Error stopping process: ${err.message}`, 'ERROR');
    return { success: false, message: err.message };
  }
}

// Fetch enctoken using Kite API endpoints directly
async function fetchEnctokenViaLogin(userId, password, totp) {
  try {
    log('Starting Kite API login...', 'INFO');

    // Step 1: Login with userId and password
    log(`Logging in with user ID: ${userId}`, 'INFO');

    const loginResponse = await axios.post('https://kite.zerodha.com/api/login', {
      user_id: userId,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (loginResponse.data.status !== 'success') {
      throw new Error(loginResponse.data.message || 'Login failed');
    }

    const requestId = loginResponse.data.data.request_id;
    log(`Login successful, request_id: ${requestId}`, 'INFO');

    // Step 2: Submit 2FA/TOTP
    log('Submitting 2FA code...', 'INFO');

    const twoFaResponse = await axios.post('https://kite.zerodha.com/api/twofa', {
      user_id: userId,
      request_id: requestId,
      twofa_value: totp,
      twofa_type: 'totp',
      skip_session: 'false'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 302 || status === 200
    });

    // Extract enctoken from Set-Cookie header
    const cookies = twoFaResponse.headers['set-cookie'];

    if (!cookies || !Array.isArray(cookies)) {
      throw new Error('No cookies received from 2FA response');
    }

    let enctoken = null;
    for (const cookie of cookies) {
      const match = cookie.match(/enctoken=([^;]+)/);
      if (match) {
        enctoken = match[1];
        break;
      }
    }

    if (!enctoken) {
      throw new Error('Enctoken not found in response cookies');
    }

    log('Enctoken successfully extracted', 'INFO');
    return { success: true, enctoken };

  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
    log(`Login failed: ${errorMessage}`, 'ERROR');

    // Provide more specific error messages
    if (err.response?.status === 403) {
      return { success: false, error: 'Invalid credentials or account locked' };
    } else if (err.response?.status === 429) {
      return { success: false, error: 'Too many login attempts. Please try again later.' };
    } else if (errorMessage.includes('TOTP')) {
      return { success: false, error: 'Invalid or expired 2FA code' };
    }

    return { success: false, error: errorMessage };
  }
}

// Get process status
function getProcessStatus() {
  const status = {
    running: tradingProcess !== null,
    pid: tradingProcess ? tradingProcess.pid : null,
    startTime: processStartTime,
    uptime: processStartTime ? Math.floor((new Date() - processStartTime) / 1000) : null,
    restartCount: processRestartCount,
    lastRestartTime: lastRestartTime,
    enctokenValid: validateEnctoken(getEnctoken())
  };

  return status;
}

// ==================== API ENDPOINTS ====================

// Health check (no auth required for monitoring)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== PROTECTED API ENDPOINTS (require authentication) ==========

// Get system status
app.get('/api/status', (req, res) => {
  const status = getProcessStatus();
  res.json({ success: true, data: status });
});

// Apply authentication and rate limiting to all /api/* endpoints
app.use('/api', security.apiLimiter, security.requireAuth);


// Start trading
app.post('/api/trading/start', (req, res) => {
  try {
    // Validate and sanitize input
    const validated = security.validateTradingParams(req.body);

    const processArgs = [];

    if (validated.instrument) {
      processArgs.push('--instrument', validated.instrument);
    }
    if (validated.tradingsymbol) {
      processArgs.push('--tradingsymbol', validated.tradingsymbol);
    }
    if (validated.paper) {
      processArgs.push('--paper');
    }
    if (validated.notimeexit) {
      processArgs.push('--notimeexit');
    }

    // Add trading parameters if provided
    if (validated.capital) processArgs.push('--capital', validated.capital.toString());
    if (validated.timeframe) processArgs.push('--timeframe', validated.timeframe.toString());
    if (validated.slTicks) processArgs.push('--sl-ticks', validated.slTicks.toString());
    if (validated.targetTicks) processArgs.push('--target-ticks', validated.targetTicks.toString());
    if (validated.riskPercent) processArgs.push('--risk-percent', validated.riskPercent.toString());

    const result = startTradingProcess(processArgs);

    if (result.success) {
      security.logSecurityEvent('TRADING_STARTED', req.ip, { instrument: validated.instrument });
      res.json({ success: true, message: result.message, pid: result.pid });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (err) {
    security.sendErrorResponse(err, res, 400);
  }
});

// Stop trading
app.post('/api/trading/stop', (req, res) => {
  try {
    const result = stopTradingProcess();

    if (result.success) {
      security.logSecurityEvent('TRADING_STOPPED', req.ip);
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (err) {
    security.sendErrorResponse(err, res, 400);
  }
});

// Restart trading
app.post('/api/trading/restart', (req, res) => {
  try {
    // Validate and sanitize input
    const validated = security.validateTradingParams(req.body);

    // Stop first
    if (tradingProcess) {
      stopTradingProcess();

      // Wait 2 seconds before restarting
      setTimeout(() => {
        const processArgs = [];

        if (validated.instrument) processArgs.push('--instrument', validated.instrument);
        if (validated.tradingsymbol) processArgs.push('--tradingsymbol', validated.tradingsymbol);
        if (validated.paper) processArgs.push('--paper');
        if (validated.notimeexit) processArgs.push('--notimeexit');

        startTradingProcess(processArgs);
      }, 2000);

      security.logSecurityEvent('TRADING_RESTARTED', req.ip, { instrument: validated.instrument });
      res.json({ success: true, message: 'Trading process restarting...' });
    } else {
      res.status(400).json({ success: false, error: 'No process to restart' });
    }
  } catch (err) {
    security.sendErrorResponse(err, res, 400);
  }
});

// Update enctoken
app.post('/api/enctoken/update', (req, res) => {
  const { enctoken } = req.body;

  if (!enctoken) {
    return res.status(400).json({ success: false, error: 'Enctoken is required' });
  }

  if (!validateEnctoken(enctoken)) {
    return res.status(400).json({ success: false, error: 'Invalid enctoken format' });
  }

  try {
    // Backup existing enctoken
    if (fs.existsSync(ENCTOKEN_FILE)) {
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const backupFile = path.join(ENCTOKEN_BACKUP_DIR, `enctoken_${timestamp}.bak`);
      fs.copyFileSync(ENCTOKEN_FILE, backupFile);
      log(`Backed up enctoken to ${backupFile}`, 'INFO');
    }

    // Write new enctoken with secure permissions
    fs.writeFileSync(ENCTOKEN_FILE, `ENCTOKEN="${enctoken}"\n`, { mode: 0o600 });
    security.logSecurityEvent('ENCTOKEN_UPDATED', req.ip);
    log('Enctoken updated successfully', 'INFO');

    res.json({ success: true, message: 'Enctoken updated successfully' });
  } catch (err) {
    log(`Error updating enctoken: ${err.message}`, 'ERROR');
    security.sendErrorResponse(err, res, 500);
  }
});

// Get enctoken status
app.get('/api/enctoken/status', (req, res) => {
  const enctoken = getEnctoken();
  const valid = validateEnctoken(enctoken);

  res.json({
    success: true,
    data: {
      exists: !!enctoken,
      valid: valid,
      length: enctoken ? enctoken.length : 0,
      preview: enctoken ? `${enctoken.substring(0, 10)}...${enctoken.substring(enctoken.length - 10)}` : null
    }
  });
});

// Login to Kite and fetch enctoken (with login rate limiting)
app.post('/api/enctoken/login', security.loginLimiter, async (req, res) => {
  try {
    // Validate credentials
    const credentials = security.validateCredentials(req.body);

    log(`Login attempt for user: ${credentials.userId}`, 'INFO');

    // Fetch enctoken via login automation
    const result = await fetchEnctokenViaLogin(credentials.userId, credentials.password, credentials.totp);

    if (!result.success) {
      log(`Login failed for user ${credentials.userId}: ${result.error}`, 'ERROR');
      security.logSecurityEvent('LOGIN_FAILED', req.ip, { userId: credentials.userId, error: result.error });
      return res.status(401).json({
        success: false,
        error: result.error || 'Login failed'
      });
    }

    const enctoken = result.enctoken;

    // Backup existing enctoken
    if (fs.existsSync(ENCTOKEN_FILE)) {
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const backupFile = path.join(ENCTOKEN_BACKUP_DIR, `enctoken_${timestamp}.bak`);
      fs.copyFileSync(ENCTOKEN_FILE, backupFile);
      log(`Backed up enctoken to ${backupFile}`, 'INFO');
    }

    // Write new enctoken with secure permissions
    fs.writeFileSync(ENCTOKEN_FILE, `ENCTOKEN="${enctoken}"\n`, { mode: 0o600 });
    security.logSecurityEvent('LOGIN_SUCCESS', req.ip, { userId: credentials.userId });
    log(`Enctoken updated successfully via login for user ${credentials.userId}`, 'INFO');

    res.json({
      success: true,
      message: 'Login successful, enctoken updated',
      data: {
        enctokenLength: enctoken.length,
        preview: `${enctoken.substring(0, 10)}...${enctoken.substring(enctoken.length - 10)}`
      }
    });

  } catch (err) {
    log(`Error during login automation: ${err.message}`, 'ERROR');
    security.sendErrorResponse(err, res, 500);
  }
});

// Get logs
app.get('/api/logs', (req, res) => {
  const { lines = 100, filter } = req.query;

  try {
    if (!fs.existsSync(SUPERVISOR_LOG)) {
      return res.json({ success: true, data: { logs: [] } });
    }

    const logContent = fs.readFileSync(SUPERVISOR_LOG, 'utf8');
    let logLines = logContent.split('\n').filter(line => line.trim());

    // Apply filter if provided (sanitize regex to prevent ReDoS)
    if (filter) {
      try {
        const filterRegex = new RegExp(filter, 'i');
        logLines = logLines.filter(line => filterRegex.test(line));
      } catch (regexErr) {
        return res.status(400).json({ success: false, error: 'Invalid filter pattern' });
      }
    }

    // Get last N lines (with safety limit)
    const requestedLines = Math.min(parseInt(lines) || 100, 10000);
    const recentLogs = logLines.slice(-requestedLines);

    res.json({
      success: true,
      data: {
        logs: recentLogs,
        totalLines: logLines.length
      }
    });
  } catch (err) {
    log(`Error reading logs: ${err.message}`, 'ERROR');
    security.sendErrorResponse(err, res, 500);
  }
});

// Get log file (download)
app.get('/api/logs/download', (req, res) => {
  try {
    if (!fs.existsSync(SUPERVISOR_LOG)) {
      return res.status(404).json({ success: false, error: 'Log file not found' });
    }

    security.logSecurityEvent('LOGS_DOWNLOADED', req.ip);
    res.download(SUPERVISOR_LOG, 'supervisor.log');
  } catch (err) {
    log(`Error downloading logs: ${err.message}`, 'ERROR');
    security.sendErrorResponse(err, res, 500);
  }
});

// Clear logs
app.post('/api/logs/clear', (req, res) => {
  try {
    if (fs.existsSync(SUPERVISOR_LOG)) {
      // Backup before clearing
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const backupFile = path.join(LOG_DIR, `supervisor_${timestamp}.log.bak`);
      fs.copyFileSync(SUPERVISOR_LOG, backupFile);

      // Clear log file
      fs.writeFileSync(SUPERVISOR_LOG, '');
      security.logSecurityEvent('LOGS_CLEARED', req.ip);
      log('Log file cleared (backup created)', 'INFO');

      res.json({ success: true, message: 'Logs cleared', backupFile });
    } else {
      res.json({ success: true, message: 'No logs to clear' });
    }
  } catch (err) {
    log(`Error clearing logs: ${err.message}`, 'ERROR');
    security.sendErrorResponse(err, res, 500);
  }
});

// Get backtest results (if exists)
app.get('/api/backtest/results', (req, res) => {
  try {
    const resultsFile = path.join(__dirname, 'backtest_results.json');

    if (!fs.existsSync(resultsFile)) {
      return res.status(404).json({ success: false, error: 'No backtest results found' });
    }

    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    res.json({ success: true, data: results });
  } catch (err) {
    security.sendErrorResponse(err, res, 500);
  }
});

// Run backtest (with backtest rate limiting)
app.post('/api/backtest/run', security.backtestLimiter, (req, res) => {
  try {
    // Validate and sanitize input
    const validated = security.validateTradingParams(req.body);

    const processArgs = [];

    if (validated.instrument) processArgs.push('--instrument', validated.instrument);
    if (validated.tradingsymbol) processArgs.push('--tradingsymbol', validated.tradingsymbol);
    if (validated.notimeexit) processArgs.push('--notimeexit');

    security.logSecurityEvent('BACKTEST_STARTED', req.ip, { instrument: validated.instrument });
    log('Running backtest...', 'INFO');

    const backtestProcess = spawn('node', ['kite.js', ...processArgs], {
      stdio: 'pipe',
      env: { ...process.env, ENCTOKEN: getEnctoken() }
    });

    let output = '';
    let errorOutput = '';

    backtestProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    backtestProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    backtestProcess.on('close', (code) => {
      if (code === 0) {
        security.logSecurityEvent('BACKTEST_COMPLETED', req.ip);
        log('Backtest completed successfully', 'INFO');
        res.json({
          success: true,
          message: 'Backtest completed',
          output: output,
          exitCode: code
        });
      } else {
        log(`Backtest failed with code ${code}`, 'ERROR');
        res.status(500).json({
          success: false,
          error: 'Backtest failed',
          output: output,
          errorOutput: errorOutput,
          exitCode: code
        });
      }
    });
  } catch (err) {
    security.sendErrorResponse(err, res, 400);
  }
});

// Get cache files
app.get('/api/cache', (req, res) => {
  try {
    const cacheDir = path.join(__dirname, 'cache');

    if (!fs.existsSync(cacheDir)) {
      return res.json({ success: true, data: { files: [] } });
    }

    const files = fs.readdirSync(cacheDir).map(filename => {
      // Sanitize filename to prevent path traversal info disclosure
      const safeName = security.sanitizeFilename(filename);
      const filePath = path.join(cacheDir, filename);

      // Verify path is safe
      if (!security.isSafePath(cacheDir, filePath)) {
        return null;
      }

      const stats = fs.statSync(filePath);

      return {
        name: safeName,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      };
    }).filter(f => f !== null);

    res.json({ success: true, data: { files } });
  } catch (err) {
    security.sendErrorResponse(err, res, 500);
  }
});

// Clear cache
app.post('/api/cache/clear', (req, res) => {
  try {
    const cacheDir = path.join(__dirname, 'cache');

    if (!fs.existsSync(cacheDir)) {
      return res.json({ success: true, message: 'No cache to clear' });
    }

    const files = fs.readdirSync(cacheDir);
    let deletedCount = 0;

    files.forEach(file => {
      const filePath = path.join(cacheDir, file);

      // Verify path is safe before deleting
      if (security.isSafePath(cacheDir, filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    security.logSecurityEvent('CACHE_CLEARED', req.ip, { deletedCount });
    log(`Cleared ${deletedCount} cache files`, 'INFO');
    res.json({ success: true, message: `Cleared ${deletedCount} cache files` });
  } catch (err) {
    log(`Error clearing cache: ${err.message}`, 'ERROR');
    security.sendErrorResponse(err, res, 500);
  }
});

// Validate enctoken with Kite API endpoint
app.get('/api/enctoken/validate', async (req, res) => {
  const enctoken = getEnctoken();

  if (!enctoken) {
    return res.json({
      success: true,
      data: {
        valid: false,
        error: 'No enctoken found'
      }
    });
  }

  const result = await validateEnctokenWithAPI(enctoken);
  res.json({ success: true, data: result });
});

// Configure email settings
app.post('/api/email/config', (req, res) => {
  try {
    // Validate email configuration
    const emailConfig = security.validateEmailConfig(req.body);

    const config = `EMAIL_HOST="${emailConfig.host}"
EMAIL_PORT="${emailConfig.port}"
EMAIL_USER="${emailConfig.user}"
EMAIL_PASS="${emailConfig.pass}"
EMAIL_TO="${emailConfig.to}"
`;

    fs.writeFileSync(EMAIL_CONFIG_FILE, config, { mode: 0o600 });
    security.logSecurityEvent('EMAIL_CONFIG_UPDATED', req.ip);
    log('Email configuration updated', 'INFO');

    res.json({
      success: true,
      message: 'Email configuration saved'
    });
  } catch (err) {
    log(`Error saving email config: ${err.message}`, 'ERROR');
    security.sendErrorResponse(err, res, 400);
  }
});

// Get email configuration status
app.get('/api/email/status', (req, res) => {
  const config = getEmailConfig();

  res.json({
    success: true,
    data: {
      configured: !!config,
      host: config?.host || null,
      user: config?.user || null,
      to: config?.to || null
    }
  });
});

// Send test email
app.post('/api/email/test', async (req, res) => {
  const result = await sendEmailAlert('Test Alert', 'This is a test email from your Kite Trading Bot.');

  if (result.success) {
    res.json({ success: true, message: 'Test email sent successfully' });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

// Get open positions
app.get('/api/positions', async (req, res) => {
  const enctoken = getEnctoken();

  if (!enctoken) {
    return res.status(401).json({ success: false, error: 'No enctoken available' });
  }

  try {
    const response = await axios.get('https://kite.zerodha.com/oms/portfolio/positions', {
      headers: {
        'Authorization': `enctoken ${enctoken}`,
        'X-Kite-Version': '3',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data.status === 'success') {
      const positions = response.data.data.net || [];
      const openPositions = positions.filter(p => p.quantity !== 0);

      res.json({
        success: true,
        data: {
          positions: openPositions,
          count: openPositions.length
        }
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to fetch positions' });
    }
  } catch (err) {
    if (err.response?.status === 403) {
      res.status(403).json({ success: false, error: 'Enctoken is expired or invalid' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Error handler
app.use((err, req, res, next) => {
  log(`API Error: ${err.message}`, 'ERROR');
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  log(`API Server started on port ${PORT}`, 'INFO');
  console.log(`\n🚀 Kite Trading API Server`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health                    - Health check`);
  console.log(`  GET  /api/status                - Get trading status`);
  console.log(`  POST /api/trading/start         - Start trading`);
  console.log(`  POST /api/trading/stop          - Stop trading`);
  console.log(`  POST /api/trading/restart       - Restart trading`);
  console.log(`  POST /api/enctoken/update       - Update enctoken`);
  console.log(`  GET  /api/enctoken/status       - Get enctoken status`);
  console.log(`  GET  /api/logs                  - Get logs`);
  console.log(`  GET  /api/logs/download         - Download log file`);
  console.log(`  POST /api/logs/clear            - Clear logs`);
  console.log(`  POST /api/backtest/run          - Run backtest`);
  console.log(`  GET  /api/backtest/results      - Get backtest results`);
  console.log(`  GET  /api/cache                 - List cache files`);
  console.log(`  POST /api/cache/clear           - Clear cache`);
  console.log(`  GET  /api/enctoken/validate     - Validate enctoken with Kite API`);
  console.log(`  POST /api/email/config          - Configure email alerts`);
  console.log(`  GET  /api/email/status          - Get email configuration status`);
  console.log(`  POST /api/email/test            - Send test email`);
  console.log(`  GET  /api/positions             - Get open positions`);
  console.log(`\n`);

  // Start background monitoring
  startBackgroundMonitoring();
});

// Background monitoring state
let enctokenValid = true;
let lastEnctokenCheck = null;
let lastEmailAlert = null;
let monitoringInterval = null;
let cacheCleanupInterval = null;
let lastKnownPositions = []; // Store last known positions BEFORE token expires

// Background monitoring for enctoken validity and open positions
async function checkEnctokenAndPositions() {
  try {
    const enctoken = getEnctoken();
    if (!enctoken) {
      log('No enctoken found during monitoring check', 'WARN');
      return;
    }

    // Validate enctoken with Kite API
    const validation = await validateEnctokenWithAPI(enctoken);
    lastEnctokenCheck = new Date();

    // If token is VALID, check and store current positions
    if (validation.valid) {
      // Token is valid - update stored positions
      try {
        const positionsResponse = await axios.get('https://kite.zerodha.com/oms/portfolio/positions', {
          headers: {
            'Authorization': `enctoken ${enctoken}`,
            'X-Kite-Version': '3'
          },
          timeout: 10000
        });

        if (positionsResponse.status === 200) {
          const positions = positionsResponse.data.data?.net || [];
          lastKnownPositions = positions.filter(p => p.quantity !== 0);
        }
      } catch (err) {
        log(`Failed to fetch positions: ${err.message}`, 'WARN');
      }

      // Check if token was previously invalid and is now valid
      if (!enctokenValid) {
        enctokenValid = true;
        log('Enctoken is now valid again', 'INFO');

        // Send recovery email
        await sendEmailAlert(
          'Enctoken Restored',
          `Your Kite enctoken is now valid again.\n\n` +
          `You can resume trading from the dashboard:\n` +
          `${process.env.DASHBOARD_URL || 'http://localhost:3000'}`
        );
      }
    } else {
      // Token is INVALID
      if (enctokenValid) {
        // Token just became invalid
        enctokenValid = false;
        log('Enctoken validation failed! Token may be expired.', 'ERROR');

        // Stop trading if running
        if (tradingProcess) {
          log('Stopping trading due to invalid enctoken', 'WARN');
          stopTradingProcess();
        }

        // Check if we had open positions when token was last valid
        const hasOpenPositions = lastKnownPositions.length > 0;

        if (hasOpenPositions) {
          // URGENT: Had open positions when token expired
          const positionDetails = lastKnownPositions.map(p =>
            `- ${p.tradingsymbol}: ${p.quantity} qty, Last known P&L: ₹${p.pnl.toFixed(2)}`
          ).join('\n');

          await sendEmailAlert(
            'URGENT: Enctoken Expired with Open Positions!',
            `⚠️ CRITICAL ALERT ⚠️\n\n` +
            `Your Kite enctoken has expired and you had ${lastKnownPositions.length} OPEN POSITION(S)!\n\n` +
            `Last Known Positions (before expiry):\n${positionDetails}\n\n` +
            `⚠️ IMMEDIATE ACTION REQUIRED:\n` +
            `1. Login to Kite directly: https://kite.zerodha.com\n` +
            `2. Check your current positions\n` +
            `3. Close positions if needed\n` +
            `4. Update enctoken in dashboard: ${process.env.DASHBOARD_URL || 'http://localhost:3000'}\n\n` +
            `Error: ${validation.error}\n\n` +
            `Note: Position data is from before token expired. Current positions may differ.\n` +
            `Trading has been automatically stopped.`
          );
        } else {
          // No open positions when token expired
          await sendEmailAlert(
            'Enctoken Expired - Action Required',
            `Your Kite enctoken has expired or become invalid.\n\n` +
            `Error: ${validation.error}\n\n` +
            `No open positions were detected when token expired.\n\n` +
            `Please login again to resume trading:\n` +
            `${process.env.DASHBOARD_URL || 'http://localhost:3000'}\n\n` +
            `Trading has been automatically stopped.`
          );
        }

        lastEmailAlert = new Date();
      } else {
        // Token has been invalid for a while
        // Send recurring alerts if we had open positions
        if (lastKnownPositions.length > 0) {
          const now = new Date();
          if (!lastEmailAlert || (now - lastEmailAlert) >= 5 * 60 * 1000) {
            const positionDetails = lastKnownPositions.map(p =>
              `- ${p.tradingsymbol}: ${p.quantity} qty, Last known P&L: ₹${p.pnl.toFixed(2)}`
            ).join('\n');

            await sendEmailAlert(
              'REMINDER: Open Positions with Expired Enctoken',
              `⚠️ RECURRING ALERT ⚠️\n\n` +
              `Your enctoken is still expired and you had ${lastKnownPositions.length} open position(s)!\n\n` +
              `Last Known Positions (before expiry):\n${positionDetails}\n\n` +
              `⚠️ IMMEDIATE ACTION REQUIRED:\n` +
              `1. Login to Kite: https://kite.zerodha.com\n` +
              `2. Verify current positions (may have changed since token expired)\n` +
              `3. Close positions if needed\n` +
              `4. Update enctoken: ${process.env.DASHBOARD_URL || 'http://localhost:3000'}\n\n` +
              `This alert will repeat every 5 minutes until enctoken is updated.`
            );

            lastEmailAlert = now;
            log(`Sent recurring email alert for ${lastKnownPositions.length} last known positions`, 'WARN');
          }
        }
      }
    }
  } catch (err) {
    log(`Error in background monitoring: ${err.message}`, 'ERROR');
  }
}

// Clean cache files older than 24 hours
async function cleanOldCache() {
  try {
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) return;

    const files = fs.readdirSync(cacheDir);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(cacheDir, file);
      const stats = fs.statSync(filePath);

      // Delete if older than 24 hours
      if (now - stats.mtimeMs > oneDayMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      log(`Auto-cleaned ${deletedCount} cache files older than 24 hours`, 'INFO');
    }
  } catch (err) {
    log(`Error cleaning old cache: ${err.message}`, 'ERROR');
  }
}

// Start background monitoring
function startBackgroundMonitoring() {
  log('Starting background monitoring...', 'INFO');

  // Check enctoken validity every 5 minutes
  monitoringInterval = setInterval(checkEnctokenAndPositions, 5 * 60 * 1000);

  // Clean old cache files every hour
  cacheCleanupInterval = setInterval(cleanOldCache, 60 * 60 * 1000);

  // Run initial checks
  checkEnctokenAndPositions();
  cleanOldCache();

  log('Background monitoring started (enctoken check: 5min, cache cleanup: 1hr)', 'INFO');
}

// Stop background monitoring
function stopBackgroundMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
  log('Background monitoring stopped', 'INFO');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully...', 'INFO');
  stopBackgroundMonitoring();
  if (tradingProcess) {
    stopTradingProcess();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully...', 'INFO');
  stopBackgroundMonitoring();
  if (tradingProcess) {
    stopTradingProcess();
  }
  process.exit(0);
});
