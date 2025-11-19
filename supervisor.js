#!/usr/bin/env node
/*
Supervisor Script for Kite Trading Bot
- Auto-restarts on crash
- Validates enctoken before trading
- Monitors process health
- Logs all activities

Usage:
  node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT

Environment Variables:
  ENCTOKEN - Required authentication token (refreshed daily)
  MAX_RESTARTS - Maximum restart attempts per hour (default: 10)
  HEALTH_CHECK_INTERVAL - Health check interval in ms (default: 30000)
*/

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

// Configuration
const MAX_RESTARTS_PER_HOUR = parseInt(process.env.MAX_RESTARTS || '10');
const HEALTH_CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000');
const LOG_FILE = path.join(__dirname, 'supervisor.log');
const ENCTOKEN_CHECK_INTERVAL = 60 * 60 * 1000; // Check enctoken every hour

// State tracking
let childProcess = null;
let restartCount = 0;
let lastRestartTime = Date.now();
let restartHistory = [];
let lastEnctokenCheck = Date.now();

// Parse command line arguments
const args = process.argv.slice(2);

/**
 * Append log message to file and console
 */
function log(message, level = 'INFO') {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);

  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (e) {
    console.error('Failed to write to log file:', e.message);
  }
}

/**
 * Validate enctoken is present and format looks correct
 */
function validateEnctoken() {
  const enctoken = process.env.ENCTOKEN;

  if (!enctoken) {
    log('ERROR: ENCTOKEN environment variable not set!', 'ERROR');
    log('Set it with: export ENCTOKEN="your_token_here"', 'ERROR');
    return false;
  }

  if (enctoken.length < 50) {
    log('WARNING: ENCTOKEN looks too short, may be invalid', 'WARN');
  }

  // Check if enctoken might be expired (very basic check)
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Warn if running early morning (enctoken likely expired at 3:30 AM)
  if (hour >= 3 && hour < 9 && (hour > 3 || minute >= 30)) {
    log('WARNING: Running after 3:30 AM - enctoken may have expired!', 'WARN');
    log('Please login to Kite and refresh your ENCTOKEN', 'WARN');
  }

  return true;
}

/**
 * Check if we should restart based on rate limiting
 */
function canRestart() {
  const now = Date.now();

  // Reset counter if an hour has passed
  if (now - lastRestartTime > 60 * 60 * 1000) {
    restartCount = 0;
    lastRestartTime = now;
    restartHistory = [];
  }

  // Check restart limit
  if (restartCount >= MAX_RESTARTS_PER_HOUR) {
    log(`ERROR: Maximum restart limit (${MAX_RESTARTS_PER_HOUR}/hour) reached!`, 'ERROR');
    log('Too many crashes. Please check the logs and fix the issue.', 'ERROR');
    return false;
  }

  return true;
}

/**
 * Start the trading script
 */
function startTradingScript() {
  if (!validateEnctoken()) {
    log('Cannot start: Invalid or missing enctoken', 'ERROR');
    process.exit(1);
  }

  if (!canRestart()) {
    log('Cannot restart: Too many failures', 'ERROR');
    process.exit(1);
  }

  log('Starting kite.js trading script...');

  // Spawn child process
  childProcess = spawn('node', ['kite.js', ...args], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env
  });

  restartCount++;
  restartHistory.push({
    timestamp: Date.now(),
    restartNumber: restartCount
  });

  log(`Started with PID: ${childProcess.pid} (Restart #${restartCount})`);

  // Handle stdout
  childProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      process.stdout.write(data);

      // Check for critical errors in output
      if (output.includes('enctoken') && output.includes('401')) {
        log('CRITICAL: Enctoken appears to be expired!', 'ERROR');
        log('Please update ENCTOKEN environment variable', 'ERROR');
      }
    }
  });

  // Handle stderr
  childProcess.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      process.stderr.write(data);
      log(`STDERR: ${error}`, 'ERROR');
    }
  });

  // Handle process exit
  childProcess.on('exit', (code, signal) => {
    log(`Process exited with code ${code}, signal ${signal}`, 'WARN');
    childProcess = null;

    if (signal === 'SIGTERM' || signal === 'SIGINT') {
      log('Received termination signal, not restarting');
      process.exit(0);
    }

    // Auto-restart after 5 seconds
    log('Restarting in 5 seconds...');
    setTimeout(() => {
      startTradingScript();
    }, 5000);
  });

  // Handle errors
  childProcess.on('error', (error) => {
    log(`Failed to start process: ${error.message}`, 'ERROR');
    childProcess = null;

    // Retry after 10 seconds
    setTimeout(() => {
      startTradingScript();
    }, 10000);
  });
}

/**
 * Perform health check
 */
function healthCheck() {
  // Check if child process is running
  if (childProcess && !childProcess.killed) {
    // Process is running - all good
    return;
  }

  if (!childProcess) {
    log('Health check: Child process not running, attempting restart...', 'WARN');
    startTradingScript();
  }
}

/**
 * Periodic enctoken validation
 */
function enctokenCheck() {
  const now = Date.now();
  if (now - lastEnctokenCheck < ENCTOKEN_CHECK_INTERVAL) {
    return;
  }

  lastEnctokenCheck = now;
  log('Performing periodic enctoken validation...');

  const hour = new Date().getHours();
  if (hour >= 3 && hour < 9) {
    log('WARNING: Market closed hours - enctoken may need refresh', 'WARN');
  }
}

/**
 * Graceful shutdown
 */
function shutdown() {
  log('Shutting down supervisor...');

  if (childProcess && !childProcess.killed) {
    log('Terminating child process...');
    childProcess.kill('SIGTERM');

    // Force kill after 10 seconds if still running
    setTimeout(() => {
      if (childProcess && !childProcess.killed) {
        log('Force killing child process...', 'WARN');
        childProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 10000);
  } else {
    process.exit(0);
  }
}

/**
 * Print startup banner
 */
function printBanner() {
  console.log('\n' + '='.repeat(60));
  console.log('  🤖 Kite Trading Bot Supervisor');
  console.log('  Auto-restart enabled | Crash recovery active');
  console.log('='.repeat(60));
  console.log(`  Max Restarts: ${MAX_RESTARTS_PER_HOUR}/hour`);
  console.log(`  Health Check: Every ${HEALTH_CHECK_INTERVAL/1000}s`);
  console.log(`  Log File: ${LOG_FILE}`);
  console.log(`  Arguments: ${args.join(' ')}`);
  console.log('='.repeat(60) + '\n');
}

// Main execution
function main() {
  printBanner();

  log('=== Supervisor Started ===');
  log(`Node Version: ${process.version}`);
  log(`Working Directory: ${process.cwd()}`);

  // Validate enctoken at startup
  if (!validateEnctoken()) {
    log('Startup validation failed', 'ERROR');
    process.exit(1);
  }

  // Handle termination signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start the trading script
  startTradingScript();

  // Set up health check interval
  setInterval(healthCheck, HEALTH_CHECK_INTERVAL);

  // Set up enctoken validation interval
  setInterval(enctokenCheck, ENCTOKEN_CHECK_INTERVAL);

  log('Supervisor is now monitoring the trading script');
}

// Run if this is the main module
if (require.main === module) {
  main();
}
