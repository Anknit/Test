# 🚀 Live Trading Setup Guide

Complete guide to running your Kite trading bot in production with crash recovery.

---

## 📋 Table of Contents

1. [Enctoken Management](#enctoken-management)
2. [Supervisor Script Usage](#supervisor-script-usage)
3. [Production Deployment](#production-deployment)
4. [Monitoring & Logs](#monitoring--logs)
5. [Troubleshooting](#troubleshooting)

---

## 🔐 Enctoken Management

### **⚠️ CRITICAL: Enctoken Expires Daily**

**Expiry Details:**
- ⏰ **Expires**: Every day at 3:30 AM IST
- 🔄 **Must refresh**: Daily after market close or before market open
- 📅 **Validity**: ~24 hours from last Kite login
- ❌ **No auto-refresh**: Manual login required

### **Getting Your Enctoken**

1. **Login to Kite Web**: https://kite.zerodha.com
2. **Open Browser DevTools**: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
3. **Go to Application/Storage**:
   - Chrome: Application → Storage → Cookies → https://kite.zerodha.com
   - Firefox: Storage → Cookies → https://kite.zerodha.com
4. **Find `enctoken` cookie**: Look for the cookie named `enctoken`
5. **Copy the value**: It should be a long string (100+ characters)

### **Setting Enctoken**

#### Method 1: Using the update script (Recommended)

```bash
# Make script executable (first time only)
chmod +x update-enctoken.sh

# Update enctoken
./update-enctoken.sh "YOUR_ENCTOKEN_HERE"

# Load it into environment
source .env.enctoken
export ENCTOKEN
```

#### Method 2: Manual export

```bash
export ENCTOKEN="YOUR_ENCTOKEN_HERE"
```

#### Method 3: Using .env file

```bash
# Create .env file
echo 'ENCTOKEN="YOUR_ENCTOKEN_HERE"' > .env.enctoken

# Add to .gitignore
echo ".env.enctoken" >> .gitignore

# Load it
source .env.enctoken
```

---

## 🎮 Supervisor Script Usage

The supervisor script (`supervisor.js`) provides:
- ✅ Auto-restart on crash
- ✅ Rate limiting (max 10 restarts/hour)
- ✅ Health checks every 30 seconds
- ✅ Enctoken validation
- ✅ Detailed logging

### **Basic Usage**

```bash
# Start with supervisor (paper mode)
node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --paper

# Start with supervisor (live mode)
source .env.enctoken
node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT

# Disable time exit
node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit

# Use 1-minute candles
node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --interval minute
```

### **Configuration Options**

Set via environment variables:

```bash
# Maximum restarts per hour (default: 10)
export MAX_RESTARTS=15

# Health check interval in ms (default: 30000 = 30s)
export HEALTH_CHECK_INTERVAL=60000

# Then run
node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT
```

### **Stopping the Supervisor**

```bash
# Graceful shutdown
Ctrl+C

# Or send SIGTERM
kill -TERM <PID>

# Force kill (not recommended)
kill -9 <PID>
```

---

## 🌐 Production Deployment

### **Option 1: PM2 (Recommended)**

PM2 provides process management with clustering and monitoring:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
source .env.enctoken
pm2 start supervisor.js --name "kite-trading" -- --instrument 120395527 --tradingsymbol SILVERM25FEBFUT

# View logs
pm2 logs kite-trading

# Monitor
pm2 monit

# Auto-start on reboot
pm2 startup
pm2 save

# Stop
pm2 stop kite-trading

# Restart
pm2 restart kite-trading
```

### **Option 2: Systemd Service (Linux)**

For running as a system service:

```bash
# 1. Edit kite-trading.service
nano kite-trading.service

# 2. Update paths and ENCTOKEN
# 3. Copy to systemd
sudo cp kite-trading.service /etc/systemd/system/

# 4. Reload systemd
sudo systemctl daemon-reload

# 5. Enable service
sudo systemctl enable kite-trading

# 6. Start service
sudo systemctl start kite-trading

# 7. Check status
sudo systemctl status kite-trading

# 8. View logs
journalctl -u kite-trading -f

# 9. Stop service
sudo systemctl stop kite-trading
```

### **Option 3: Docker (Advanced)**

```dockerfile
# Create Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "supervisor.js"]
```

```bash
# Build
docker build -t kite-trading .

# Run
docker run -d \
  -e ENCTOKEN="YOUR_ENCTOKEN" \
  --name kite-trading \
  --restart unless-stopped \
  kite-trading --instrument 120395527 --tradingsymbol SILVERM25FEBFUT
```

---

## 📊 Monitoring & Logs

### **Log Files**

```bash
# Supervisor log
tail -f supervisor.log

# Trading script output
# (printed to console by supervisor)

# View last 100 lines
tail -100 supervisor.log

# Search for errors
grep ERROR supervisor.log

# Search for fills
grep "Detected fill" supervisor.log
```

### **Health Check Dashboard**

Create a simple monitoring script:

```bash
#!/bin/bash
# monitor.sh - Check if bot is running

if pgrep -f "supervisor.js" > /dev/null; then
    echo "✅ Trading bot is running"
    echo "📊 Recent activity:"
    tail -5 supervisor.log
else
    echo "❌ Trading bot is NOT running!"
    echo "Starting bot..."
    source .env.enctoken
    nohup node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT &
fi
```

### **Telegram Notifications (Optional)**

Add webhook notifications to supervisor.js:

```javascript
const axios = require('axios');

async function sendTelegramAlert(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: `🤖 Kite Bot: ${message}`
    });
  } catch (e) {
    console.error('Failed to send Telegram alert:', e.message);
  }
}
```

---

## 🔧 Troubleshooting

### **Problem: "enctoken required" error**

```bash
# Check if ENCTOKEN is set
echo $ENCTOKEN

# If empty, set it
source .env.enctoken
export ENCTOKEN

# Verify it's valid
curl -H "Authorization: enctoken $ENCTOKEN" https://kite.zerodha.com/oms/orders
```

### **Problem: "401 Unauthorized" error**

**Cause**: Enctoken expired (happens daily at 3:30 AM)

**Solution**:
1. Login to Kite web again
2. Get new enctoken
3. Update using script: `./update-enctoken.sh "NEW_TOKEN"`
4. Restart: `pm2 restart kite-trading`

### **Problem: Too many restarts**

**Cause**: Script crashing repeatedly

**Solution**:
```bash
# Check logs for errors
tail -50 supervisor.log | grep ERROR

# Common issues:
# - Invalid enctoken → Update it
# - Network errors → Check internet
# - Invalid instrument → Check symbol
# - Missing dependencies → npm install
```

### **Problem: Orders not executing**

**Check**:
1. ✅ Enctoken valid?
2. ✅ Market hours (9:15 AM - 3:30 PM)?
3. ✅ Paper mode disabled for live trading?
4. ✅ Sufficient margin in account?
5. ✅ Trading symbol correct?

```bash
# Test with paper mode first
node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --paper

# Check if signals are generated
grep "Detected LONG signal" supervisor.log
grep "Detected SHORT signal" supervisor.log
```

### **Problem: Script uses old data**

**Solution**: Force refresh cache

```bash
node kite.js --instrument 120395527 --days 30 --refresh
```

---

## 📅 Daily Routine

### **Morning Checklist (Before Market Open)**

```bash
# 1. Update enctoken (MUST DO DAILY!)
./update-enctoken.sh "NEW_ENCTOKEN_FROM_KITE"

# 2. Load enctoken
source .env.enctoken

# 3. Test in paper mode
node kite.js --instrument 120395527 --days 5 --paper --notimeexit

# 4. If results look good, start live
pm2 restart kite-trading

# 5. Monitor
pm2 logs kite-trading
```

### **During Market Hours**

```bash
# Check status every hour
pm2 status

# View recent activity
tail -20 supervisor.log

# Check for fills
grep "Detected fill" supervisor.log | tail -5
```

### **After Market Close**

```bash
# Stop bot
pm2 stop kite-trading

# Review performance
grep "BACKTEST RESULTS" supervisor.log | tail -1
grep "Total P&L" supervisor.log | tail -1

# Backup logs
cp supervisor.log logs/supervisor_$(date +%Y%m%d).log
```

---

## 🎯 Quick Start Checklist

- [ ] Install dependencies: `npm install`
- [ ] Get enctoken from Kite web
- [ ] Update enctoken: `./update-enctoken.sh "TOKEN"`
- [ ] Test in paper mode: `node kite.js --paper`
- [ ] Start supervisor: `node supervisor.js --paper`
- [ ] Monitor logs: `tail -f supervisor.log`
- [ ] When ready for live, remove `--paper` flag
- [ ] **Remember**: Update enctoken DAILY!

---

## 🚨 Important Reminders

1. **⏰ Update enctoken EVERY trading day** (expires at 3:30 AM IST)
2. **📊 Test in paper mode first** before going live
3. **💰 Verify margin** is sufficient for positions
4. **🔍 Monitor logs regularly** during market hours
5. **🛑 Have a kill switch ready** (Ctrl+C or pm2 stop)
6. **📱 Set up alerts** for critical events
7. **🔒 Secure your enctoken** (never commit to git)
8. **💾 Backup logs daily** for analysis

---

## 📞 Support

If issues persist:
1. Check logs: `supervisor.log`
2. Test with paper mode
3. Verify enctoken validity
4. Check Zerodha status page
5. Review this guide again

**Happy Trading! 🚀**
