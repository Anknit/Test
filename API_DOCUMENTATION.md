# Kite Trading Bot - API Documentation

## Overview

This document describes the REST API for controlling the Kite Trading Bot. The API allows you to start/stop trading, **automatically login to fetch enctoken**, update enctoken, fetch logs, run backtests, and manage the system remotely.

**NEW:** `/api/enctoken/login` endpoint - Automatically login with username, password, and 2FA to fetch enctoken!

**Base URL**: `http://localhost:3000`

**Response Format**: All responses are in JSON format with the following structure:
```json
{
  "success": true/false,
  "data": { ... },        // For successful responses
  "error": "message",     // For error responses
  "message": "message"    // For informational messages
}
```

---

## Table of Contents

1. [Health & Status](#health--status)
2. [Trading Control](#trading-control)
3. [Enctoken Management](#enctoken-management)
4. [Logs Management](#logs-management)
5. [Backtesting](#backtesting)
6. [Cache Management](#cache-management)
7. [Error Codes](#error-codes)
8. [Usage Examples](#usage-examples)

---

## Health & Status

### GET /health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### GET /api/status

Get the current status of the trading process.

**Response:**
```json
{
  "success": true,
  "data": {
    "running": true,
    "pid": 12345,
    "startTime": "2025-01-15T09:15:00.000Z",
    "uptime": 4500,
    "restartCount": 0,
    "lastRestartTime": null,
    "enctokenValid": true
  }
}
```

**Fields:**
- `running`: Whether trading process is currently running
- `pid`: Process ID (null if not running)
- `startTime`: When the process started
- `uptime`: Uptime in seconds
- `restartCount`: Number of automatic restarts
- `lastRestartTime`: Last restart timestamp
- `enctokenValid`: Whether the enctoken is valid

**Example:**
```bash
curl http://localhost:3000/api/status
```

---

## Trading Control

### POST /api/trading/start

Start the trading process with specified parameters.

**Request Body:**
```json
{
  "instrument": "120395527",
  "tradingsymbol": "SILVERM25FEBFUT",
  "paper": false,
  "notimeexit": true,
  "args": ["--custom-arg"]
}
```

**Parameters:**
- `instrument` (optional): Instrument token
- `tradingsymbol` (optional): Trading symbol
- `paper` (optional): Enable paper trading mode
- `notimeexit` (optional): Disable time-based exits
- `args` (optional): Additional command-line arguments

**Response:**
```json
{
  "success": true,
  "message": "Trading process started",
  "pid": 12345
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'
```

---

### POST /api/trading/stop

Stop the currently running trading process.

**Response:**
```json
{
  "success": true,
  "message": "Trading process stop signal sent"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/trading/stop
```

---

### POST /api/trading/restart

Restart the trading process with new parameters.

**Request Body:** Same as `/api/trading/start`

**Response:**
```json
{
  "success": true,
  "message": "Trading process restarting..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/trading/restart \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'
```

---

## Enctoken Management

### POST /api/enctoken/update

Update the Zerodha Kite enctoken. Creates a backup of the old token.

**Request Body:**
```json
{
  "enctoken": "your_new_enctoken_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Enctoken updated successfully"
}
```

**Errors:**
- 400: Invalid enctoken format (too short)
- 500: File system error

**Example:**
```bash
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{
    "enctoken": "your_long_enctoken_string_here"
  }'
```

**Important:**
- Enctoken expires DAILY at 3:30 AM IST
- Must be updated every trading day
- Old tokens are automatically backed up

---

### GET /api/enctoken/status

Check the status of the current enctoken.

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "valid": true,
    "length": 250,
    "preview": "abcdefghij...xyz1234567"
  }
}
```

**Fields:**
- `exists`: Whether an enctoken file exists
- `valid`: Whether the token passes validation
- `length`: Length of the token
- `preview`: First 10 and last 10 characters

**Example:**
```bash
curl http://localhost:3000/api/enctoken/status
```

---

### POST /api/enctoken/login

**NEW!** Automatically login to Kite and fetch enctoken using credentials and 2FA code.

**Request Body:**
```json
{
  "userId": "AB1234",
  "password": "your_password",
  "totp": "123456"
}
```

**Parameters:**
- `userId` (required): Zerodha user ID (format: AB1234)
- `password` (required): Kite login password
- `totp` (required): 6-digit 2FA code from authenticator app

**Response:**
```json
{
  "success": true,
  "message": "Login successful, enctoken updated",
  "data": {
    "enctokenLength": 250,
    "preview": "abcdefghij...xyz1234567"
  }
}
```

**Errors:**
- 400: Missing or invalid credentials format
- 401: Login failed (wrong password, expired TOTP, etc.)
- 500: Internal error during automation

**Example:**
```bash
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "AB1234",
    "password": "your_password",
    "totp": "123456"
  }'
```

**Important:**
- This uses Kite's official API endpoints directly (no browser automation!)
- TOTP code expires in 30 seconds - use fresh code
- Credentials are NOT stored (used only for login)
- Enctoken is automatically backed up and updated
- This is the EASIEST and FASTEST way to update enctoken daily!
- Completes in ~2-3 seconds (vs manual method taking 1-2 minutes)

**How to get TOTP:**
1. Open your authenticator app (Google Authenticator, Authy, etc.)
2. Find "Zerodha Kite" entry
3. Copy the 6-digit code
4. Use it immediately in this API call

**Security Note:**
- Consider adding API authentication for production
- Credentials are transmitted in plain text - use HTTPS
- Never log or store passwords

---

## Logs Management

### GET /api/logs

Fetch recent logs from the supervisor log file.

**Query Parameters:**
- `lines` (optional, default: 100): Number of recent lines to fetch
- `filter` (optional): Regex pattern to filter log lines

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      "[2025-01-15 09:15:00] [INFO] Trading process started",
      "[2025-01-15 09:15:05] [INFO] Signal generated: BUY"
    ],
    "totalLines": 2
  }
}
```

**Example:**
```bash
# Get last 100 logs
curl http://localhost:3000/api/logs

# Get last 500 logs
curl "http://localhost:3000/api/logs?lines=500"

# Filter logs containing "ERROR"
curl "http://localhost:3000/api/logs?filter=ERROR"
```

---

### GET /api/logs/download

Download the complete log file.

**Response:** File download (`supervisor.log`)

**Example:**
```bash
curl http://localhost:3000/api/logs/download -o supervisor.log
```

---

### POST /api/logs/clear

Clear the log file. Creates a backup before clearing.

**Response:**
```json
{
  "success": true,
  "message": "Logs cleared",
  "backupFile": "logs/supervisor_20250115_093000.log.bak"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/logs/clear
```

---

## Backtesting

### POST /api/backtest/run

Run a backtest with the current strategy.

**Request Body:**
```json
{
  "instrument": "120395527",
  "tradingsymbol": "SILVERM25FEBFUT",
  "notimeexit": true,
  "args": []
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backtest completed",
  "output": "... backtest output ...",
  "exitCode": 0
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'
```

---

### GET /api/backtest/results

Get the most recent backtest results (if saved to file).

**Response:**
```json
{
  "success": true,
  "data": {
    "trades": 130,
    "winRate": 0.3846,
    "totalPnl": 192936.85,
    "profitFactor": 2.09
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/backtest/results
```

---

## Cache Management

### GET /api/cache

List all cached data files.

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "name": "cache_120395527_2minute_20250101_20250131.json",
        "size": 524288,
        "modified": "2025-01-15T09:00:00.000Z",
        "created": "2025-01-01T10:00:00.000Z"
      }
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/cache
```

---

### POST /api/cache/clear

Clear all cached data files.

**Response:**
```json
{
  "success": true,
  "message": "Cleared 5 cache files"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/cache/clear
```

---

## Error Codes

| HTTP Status | Meaning |
|------------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters, process already running, etc.) |
| 404 | Not Found (log file, backtest results, etc.) |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Usage Examples

### Complete Trading Session

```bash
# 1. Check health
curl http://localhost:3000/health

# 2. Update enctoken
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "YOUR_ENCTOKEN"}'

# 3. Check enctoken status
curl http://localhost:3000/api/enctoken/status

# 4. Start trading (paper mode first)
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "paper": true,
    "notimeexit": true
  }'

# 5. Check status
curl http://localhost:3000/api/status

# 6. Monitor logs
curl "http://localhost:3000/api/logs?lines=50"

# 7. Stop trading
curl -X POST http://localhost:3000/api/trading/stop
```

### Daily Routine

```bash
#!/bin/bash
# Daily trading script

# Update enctoken (get from Kite website)
NEW_ENCTOKEN="YOUR_NEW_ENCTOKEN"

curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d "{\"enctoken\": \"$NEW_ENCTOKEN\"}"

# Start trading
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'

echo "Trading started. Monitor at: http://localhost:3000/api/logs"
```

### Monitoring with Watch

```bash
# Watch status every 5 seconds
watch -n 5 'curl -s http://localhost:3000/api/status | jq'

# Watch recent logs
watch -n 10 'curl -s "http://localhost:3000/api/logs?lines=20" | jq -r ".data.logs[]"'
```

---

## Security Recommendations

1. **Use HTTPS in production** - Add reverse proxy (nginx/caddy) with SSL
2. **Add authentication** - Implement API key or JWT authentication
3. **Restrict access** - Use firewall rules to limit API access
4. **Secure enctoken** - Never commit `.env.enctoken` to version control
5. **Regular backups** - Backup enctoken_backups directory
6. **Monitor logs** - Set up alerting for errors

---

## Troubleshooting

### Trading process won't start
```bash
# Check status
curl http://localhost:3000/api/status

# Check enctoken
curl http://localhost:3000/api/enctoken/status

# Check logs for errors
curl "http://localhost:3000/api/logs?filter=ERROR"
```

### Enctoken expired
```bash
# Update with new token
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "NEW_TOKEN"}'

# Restart trading
curl -X POST http://localhost:3000/api/trading/restart \
  -H "Content-Type: application/json" \
  -d '{"instrument": "120395527", "tradingsymbol": "SILVERM25FEBFUT", "notimeexit": true}'
```

### Container not accessible
```bash
# Check container status
docker ps

# Check container logs
docker logs kite-trading-api

# Check port mapping
docker port kite-trading-api
```

---

## Rate Limits

Currently, there are no rate limits implemented. For production use, consider adding rate limiting middleware to prevent abuse.

---

## Support

For issues and questions:
- Check logs: `curl http://localhost:3000/api/logs`
- Check status: `curl http://localhost:3000/api/status`
- Review [LIVE_TRADING_GUIDE.md](LIVE_TRADING_GUIDE.md) for trading-specific help
