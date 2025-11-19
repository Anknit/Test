# Security Setup Guide

Complete guide for securing your Kite Trading Bot for production deployment.

---

## Table of Contents

1. [Quick Security Checklist](#quick-security-checklist)
2. [API Key Authentication](#api-key-authentication)
3. [HTTPS Configuration](#https-configuration)
4. [Environment Variables](#environment-variables)
5. [Rate Limiting](#rate-limiting)
6. [File Permissions](#file-permissions)
7. [CORS Configuration](#cors-configuration)
8. [Testing Security](#testing-security)
9. [Production Deployment](#production-deployment)
10. [Security Monitoring](#security-monitoring)

---

## Quick Security Checklist

Before deploying to production, ensure:

- [ ] API key generated and stored securely
- [ ] `.env` file configured with all required variables
- [ ] `.env` added to `.gitignore` (never commit!)
- [ ] HTTPS enabled (or HTTP explicitly disabled in production)
- [ ] File permissions set to 600 for sensitive files
- [ ] CORS configured with allowed origins
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] Security logs reviewed
- [ ] All endpoints tested with authentication

---

## API Key Authentication

### Automatic Generation (Recommended)

On first startup, the server automatically generates a secure API key if none exists:

```bash
node api-server.js
```

**Output:**
```
🔐 API KEY GENERATED
======================================================================
API Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8

⚠️  IMPORTANT: Save this key securely!

Add this to your .env file:
API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8

You will need this key for all API requests.
======================================================================
```

**Save the key immediately:**

```bash
echo 'API_KEY=your-generated-key-here' >> .env
```

### Manual Generation

Generate your own API key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```bash
API_KEY=your-64-character-hex-string
```

### Using API Key in Requests

**All `/api/*` endpoints require authentication.**

#### Via Header (Recommended):
```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/status
```

#### Via Query Parameter (Less secure):
```bash
curl "http://localhost:3000/api/status?api_key=your-api-key"
```

### Frontend Integration

Update `public/app.js` to include API key in all requests:

```javascript
// Load API key from config or prompt user
const API_KEY = localStorage.getItem('api_key') || prompt('Enter API Key:');

// Add to all fetch requests
fetch(`${API_BASE}/api/status`, {
  headers: {
    'X-API-Key': API_KEY
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### Disabling Authentication (Development Only)

**⚠️ NEVER disable authentication in production!**

For local development only:

```bash
# .env
NODE_ENV=development
DISABLE_AUTH=true
```

---

## HTTPS Configuration

### Why HTTPS is Required

- **Encrypts credentials** during transmission
- **Prevents man-in-the-middle attacks**
- **Required for production deployment**
- **Protects API keys and sensitive data**

### Production HTTPS Enforcement

By default, HTTPS is enforced in production:

```bash
# .env
NODE_ENV=production
ALLOW_HTTP=false  # Default behavior
```

Any HTTP request will be rejected with:
```json
{
  "success": false,
  "error": "HTTPS required. Please use https:// instead of http://"
}
```

### Development HTTP Access

For local development only:

```bash
# .env
NODE_ENV=development
ALLOW_HTTP=true
```

### Setting Up HTTPS

#### Option 1: Let's Encrypt (Free, Recommended)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates stored in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### Option 2: Reverse Proxy (Nginx)

**Nginx configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Start Nginx:**
```bash
sudo systemctl restart nginx
```

#### Option 3: Self-Signed Certificate (Development)

```bash
# Generate self-signed cert (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update api-server.js to use HTTPS
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(3000);
```

---

## Environment Variables

### Complete .env Template

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
chmod 600 .env
```

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Server Port
PORT=3000

# API Authentication
API_KEY=your-64-character-api-key-here

# HTTPS Enforcement
ALLOW_HTTP=false
```

### Optional Variables

```bash
# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Email Alerts
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=bot@example.com
EMAIL_PASS=app-password-here
EMAIL_TO=alerts@example.com

# Trading Defaults
CAPITAL=450000
TIMEFRAME=3
SL_TICKS=30
TARGET_TICKS=70
RISK_PER_TRADE_PCT=0.014
```

### Loading Environment Variables

Environment variables are loaded automatically on startup via `dotenv`:

```javascript
require('dotenv').config();
```

---

## Rate Limiting

### Automatic Rate Limits

Three-tier rate limiting is automatically applied:

#### 1. Login Limiter (Most Restrictive)
- **Endpoint:** `/api/enctoken/login`
- **Limit:** 5 attempts per 15 minutes
- **Purpose:** Prevent brute force attacks

#### 2. API General Limiter
- **Endpoints:** All `/api/*` routes
- **Limit:** 100 requests per minute
- **Purpose:** Prevent API abuse

#### 3. Backtest Limiter
- **Endpoint:** `/api/backtest/run`
- **Limit:** 3 requests per 5 minutes
- **Purpose:** Prevent resource exhaustion

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests. Please slow down."
}
```

HTTP Status: `429 Too Many Requests`

### Customizing Rate Limits

Edit `security.js` to adjust limits:

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Time window
  max: 5,                     // Max attempts
  message: { success: false, error: 'Too many login attempts.' }
});
```

---

## File Permissions

### Automatic Permission Enforcement

Sensitive files are automatically checked and fixed on startup:

```javascript
security.ensureSecurePermissions(ENCTOKEN_FILE);
security.ensureSecurePermissions(EMAIL_CONFIG_FILE);
```

**Console output:**
```
⚠️  WARNING: .env.enctoken has insecure permissions (644). Setting to 600.
✅ Fixed permissions for .env.enctoken
```

### Manual Permission Check

```bash
# Check current permissions
ls -l .env.enctoken .env.email .env

# Expected output (600 = rw-------)
-rw------- 1 user group 123 Jan 24 10:00 .env.enctoken
-rw------- 1 user group 456 Jan 24 10:00 .env.email
-rw------- 1 user group 789 Jan 24 10:00 .env

# Fix manually if needed
chmod 600 .env.enctoken .env.email .env
```

### Why 600 Permissions?

- **6** (owner): Read (4) + Write (2) = 6
- **0** (group): No permissions
- **0** (others): No permissions

This ensures only the file owner can read/write sensitive files.

---

## CORS Configuration

### Default Configuration

By default, CORS is configured for localhost only:

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
```

### Production CORS Setup

Add allowed origins to `.env`:

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://www.yourdomain.com
```

### Custom CORS Configuration

Edit `security.js` for advanced CORS settings:

```javascript
function configureCors() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,  // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  });
}
```

### Testing CORS

```bash
# Test from allowed origin
curl -H "Origin: https://yourdomain.com" \
     -H "X-API-Key: your-key" \
     -v http://localhost:3000/api/status

# Test from blocked origin (should fail)
curl -H "Origin: https://malicious.com" \
     -H "X-API-Key: your-key" \
     -v http://localhost:3000/api/status
```

---

## Testing Security

### 1. Test API Authentication

**Without API Key (Should Fail):**
```bash
curl http://localhost:3000/api/status

# Expected response:
# { "success": false, "error": "Unauthorized. API key required." }
```

**With Valid API Key (Should Succeed):**
```bash
curl -H "X-API-Key: your-key" http://localhost:3000/api/status

# Expected response:
# { "success": true, "data": { "trading": "stopped", ... } }
```

### 2. Test Rate Limiting

**Trigger Login Rate Limit:**
```bash
# Send 6 login requests rapidly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/enctoken/login \
    -H "X-API-Key: your-key" \
    -H "Content-Type: application/json" \
    -d '{"userId":"AB1234","password":"wrong","totp":"123456"}'
  echo ""
done

# 6th request should return:
# { "success": false, "error": "Too many login attempts..." }
```

### 3. Test HTTPS Enforcement

**In Production Mode:**
```bash
# Set production mode
export NODE_ENV=production

# Start server
node api-server.js

# Try HTTP request (should fail)
curl http://localhost:3000/api/status

# Expected response:
# { "success": false, "error": "HTTPS required..." }
```

### 4. Test Input Validation

**Try Command Injection:**
```bash
curl -X POST http://localhost:3000/api/trading/start \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"instrument":"120395527; rm -rf /","tradingsymbol":"HACK"}'

# Should fail validation and reject
```

**Try Path Traversal:**
```bash
curl -H "X-API-Key: your-key" \
  "http://localhost:3000/api/cache?file=../../.env"

# Should be blocked by sanitization
```

### 5. Test Log Sanitization

**Check logs don't contain passwords:**
```bash
# Make a login request
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"AB1234","password":"MySecret123","totp":"123456"}'

# Check logs
tail -n 50 logs/supervisor.log | grep password

# Should show: password: ***REDACTED***
# NOT: password: MySecret123
```

---

## Production Deployment

### Pre-Deployment Checklist

```bash
# 1. Install dependencies
npm install

# 2. Run security audit
npm audit

# 3. Create .env file
cp .env.example .env
nano .env  # Configure all variables

# 4. Set secure permissions
chmod 600 .env .env.enctoken .env.email

# 5. Generate API key
node api-server.js  # Copy generated key to .env

# 6. Configure HTTPS
# Set up SSL certificate (Let's Encrypt or Nginx)

# 7. Set production mode
echo 'NODE_ENV=production' >> .env

# 8. Test all security features
# Run tests from "Testing Security" section above
```

### Starting in Production

```bash
# Start with process manager (PM2 recommended)
npm install -g pm2

pm2 start api-server.js --name kite-bot
pm2 save
pm2 startup  # Enable auto-restart on reboot
```

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3000/tcp    # API (if not behind Nginx)
sudo ufw enable
```

---

## Security Monitoring

### Security Logs

All security events are logged to `logs/security.log`:

```bash
# View recent security events
tail -f logs/security.log

# Search for failed auth attempts
grep "AUTH_FAILED" logs/security.log

# Count login attempts by IP
grep "LOGIN_" logs/security.log | cut -d'|' -f3 | sort | uniq -c
```

### Log Format

```
[2025-01-24 10:15:30] | AUTH_FAILED | 192.168.1.100 | {"apiKey":"abc123...xyz"}
[2025-01-24 10:16:45] | LOGIN_SUCCESS | 192.168.1.100 | {"userId":"AB1234"}
[2025-01-24 10:20:00] | TRADING_STARTED | 192.168.1.100 | {"instrument":"120395527"}
```

### Security Event Types

- `AUTH_FAILED` - Invalid API key
- `LOGIN_FAILED` - Invalid credentials
- `LOGIN_SUCCESS` - Successful login
- `TRADING_STARTED` - Trading process started
- `TRADING_STOPPED` - Trading process stopped
- `ENCTOKEN_UPDATED` - Enctoken manually updated
- `EMAIL_CONFIG_UPDATED` - Email settings changed
- `LOGS_CLEARED` - Log files cleared
- `LOGS_DOWNLOADED` - Logs downloaded
- `CACHE_CLEARED` - Cache files deleted
- `BACKTEST_STARTED` - Backtest initiated
- `BACKTEST_COMPLETED` - Backtest finished

### Automated Monitoring

Set up alerts for suspicious activity:

```bash
# Monitor for failed auth attempts
watch -n 10 'grep "AUTH_FAILED" logs/security.log | tail -5'

# Alert on multiple failed attempts
grep -c "AUTH_FAILED" logs/security.log | \
  awk '{if ($1 > 10) print "WARNING: Multiple failed auth attempts!"}'
```

### Email Alerts

Configure email alerts for security events:

```javascript
// In api-server.js, add email alerts for critical events
if (event === 'AUTH_FAILED') {
  const failedCount = getRecentFailedAttempts(ip);
  if (failedCount > 5) {
    sendEmailAlert(
      'Security Alert: Multiple Failed Auth Attempts',
      `IP ${ip} has failed authentication ${failedCount} times in the last hour.`
    );
  }
}
```

---

## Regular Maintenance

### Weekly Tasks

1. **Review security logs:**
   ```bash
   tail -100 logs/security.log | less
   ```

2. **Check for vulnerabilities:**
   ```bash
   npm audit
   ```

3. **Monitor failed attempts:**
   ```bash
   grep "AUTH_FAILED\|LOGIN_FAILED" logs/security.log | wc -l
   ```

### Monthly Tasks

1. **Update dependencies:**
   ```bash
   npm update
   npm audit fix
   ```

2. **Review file permissions:**
   ```bash
   ls -la .env* | grep -v "^-rw-------"
   ```

3. **Rotate API key:**
   ```bash
   # Generate new key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Update .env with new key
   # Update frontend config
   ```

### Quarterly Tasks

1. **Full security audit**
2. **Update SSL certificates** (if not auto-renewed)
3. **Review CORS allowed origins**
4. **Backup enctoken and configs**
5. **Test disaster recovery procedures**

---

## Troubleshooting

### Issue: "Unauthorized. API key required"

**Solution:**
```bash
# Check API key exists in .env
cat .env | grep API_KEY

# Verify API key in request header
curl -v -H "X-API-Key: your-key" http://localhost:3000/api/status
```

### Issue: "HTTPS required"

**Solution:**
```bash
# For development, allow HTTP
echo 'ALLOW_HTTP=true' >> .env

# For production, set up HTTPS properly
# See "HTTPS Configuration" section above
```

### Issue: "Too many requests"

**Solution:**
```bash
# Wait for rate limit window to expire
# Login limiter: 15 minutes
# API limiter: 1 minute
# Backtest limiter: 5 minutes

# Or restart server to reset counters (not recommended)
```

### Issue: File permissions warning

**Solution:**
```bash
# Fix permissions automatically
node api-server.js  # Will auto-fix on startup

# Or fix manually
chmod 600 .env.enctoken .env.email .env
```

---

## Additional Resources

- [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) - Full security audit
- [SECURITY_FIXES_IMPLEMENTED.md](SECURITY_FIXES_IMPLEMENTED.md) - All fixes applied
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) - Quick setup guide

---

## Security Contacts

**Report Security Issues:**
- **DO NOT** open public issues for security vulnerabilities
- Contact: (add your security email here)
- Include: Description, steps to reproduce, impact assessment

**Bug Bounty:**
- Responsible disclosure encouraged
- Report privately via security email
- Allow 90 days for fix before public disclosure

---

**Last Updated:** January 24, 2025
**Version:** 2.0.0-secure
**Security Level:** Production Ready
