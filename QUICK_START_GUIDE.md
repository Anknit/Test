# Quick Start Guide - Kite Trading Bot

Get your trading bot up and running in 10 minutes!

---

## Prerequisites

- Node.js 18+ installed
- Kite/Zerodha account
- 2FA app (Google Authenticator, Authy, etc.)

---

## Step 1: Install Dependencies (1 minute)

```bash
cd /Users/ankit/projects/test
npm install
```

---

## Step 2: Start API Server (30 seconds)

```bash
node api-server.js
```

**Expected Output:**
```
🚀 Kite Trading API Server
📡 Listening on http://0.0.0.0:3000

Available endpoints:
  GET  /health                    - Health check
  GET  /api/status                - Get trading status
  ...

[2025-01-24 10:00:00] [INFO] API Server started on port 3000
[2025-01-24 10:00:00] [INFO] Background monitoring started (enctoken check: 5min, cache cleanup: 1hr)
```

---

## Step 3: Open Dashboard (30 seconds)

Open your browser and go to:
```
http://localhost:3000
```

**You should see:**
- Header with "Kite Trading Bot Dashboard"
- Connection status (green "Connected")
- Left sidebar with control cards
- Main area with tabs (Logs, Backtest Results, etc.)

---

## Step 4: Login & Setup Enctoken (2 minutes)

### Option A: If Enctoken is Missing (First Time)

You'll see a **Login Modal** blocking the UI:

1. Enter your Kite credentials:
   - **User ID**: Your Kite user ID (e.g., AB1234)
   - **Password**: Your Kite password
   - **2FA Code**: Get from your authenticator app (6 digits)

2. Click **"Login & Resume"**

3. Wait ~2-3 seconds for login to complete

4. Modal will disappear and dashboard will be accessible

### Option B: If You Have Enctoken

Create `.env.enctoken` file:
```bash
echo 'ENCTOKEN="your_enctoken_here"' > .env.enctoken
chmod 600 .env.enctoken
```

Refresh the dashboard - no modal should appear.

---

## Step 5: Configure Trading Parameters (2 minutes)

In the dashboard sidebar, find the **"⚙️ Parameters"** card:

1. **Capital**: Set your trading capital (default: ₹450,000)
2. **Timeframe**: Choose candle interval (default: 3 minutes)
3. **Stop Loss**: Set SL in ticks (default: 30)
4. **Target**: Set target in ticks (default: 70)
5. **Risk %**: Risk per trade (default: 1.4%)

Click **"💾 Save Parameters"** - Toast confirms save.

**These parameters will be used for both live trading and backtesting!**

---

## Step 6: Run a Backtest (2 minutes)

1. In sidebar, set **Instrument Token**: `120395527` (SILVERM25FEBFUT)
2. Check **"Disable Time Exit"** if you want full trades
3. Click **"🧪 Run Backtest"** in the Backtest card

**Wait 10-30 seconds...**

4. Toast will show "Backtest completed successfully!"
5. Click **"📊 Load Results"** or switch to **"Backtest Results"** tab

**You'll see 6 metric cards:**
- Total P&L (green/red)
- Total Trades
- Win Rate
- Profit Factor (green/red)
- Avg Win (green)
- Avg Loss (red)

---

## Step 7: Configure Email Alerts (Optional - 3 minutes)

### For Gmail:

1. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Enable 2FA if not already enabled
   - Create app password for "Mail" > "Other (Custom name)"
   - Copy the 16-character password

2. **Configure via API:**
```bash
curl -X POST http://localhost:3000/api/email/config \
  -H "Content-Type: application/json" \
  -d '{
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "your-email@gmail.com",
    "pass": "xxxx xxxx xxxx xxxx",
    "to": "your-email@gmail.com"
  }'
```

3. **Test Email:**
```bash
curl -X POST http://localhost:3000/api/email/test
```

Check your inbox - you should receive a test email!

**Why Email Alerts?**
- Notified when enctoken expires
- Critical alerts if you have open positions with expired token
- Peace of mind for 24/7 trading

---

## Step 8: Start Live Trading (1 minute)

### Paper Trading (Recommended First)

1. In sidebar **"🎮 Trading Controls"**:
   - Instrument Token: `120395527`
   - Check **"Paper Trading Mode"** ✅
   - Check **"Disable Time Exit"** (optional)

2. Click **"▶️ Start Trading"**

3. Watch the **"Logs"** tab for live updates

**You'll see:**
```
[2025-01-24 10:05:00] [INFO] Starting trading process...
[2025-01-24 10:05:02] [TRADING] Fetching historical data...
[2025-01-24 10:05:05] [TRADING] Bars available: 5000
[2025-01-24 10:05:05] [TRADING] Starting live trading...
```

### Live Trading (Real Money!)

**⚠️ Only after testing in paper mode:**

1. Uncheck **"Paper Trading Mode"**
2. Click **"▶️ Start Trading"**
3. **Monitor closely** - real orders will be placed!

---

## Step 9: Monitor & Control

### Dashboard Tabs

**📝 Logs Tab:**
- Live logs from trading bot
- Filter by keyword
- Adjust lines shown (50/100/200/500)
- Clear logs anytime

**📊 Backtest Results Tab:**
- View latest backtest metrics
- Color-coded for quick analysis
- Includes all parameters used

**💰 Performance Tab:**
- Live trading performance (coming soon)
- Real-time P&L tracking

**💾 Cache Tab:**
- View cached historical data files
- Clear cache if needed
- Auto-cleanup runs hourly

### System Status

Top-left corner shows:
- **Trading Status**: Running/Stopped
- **PID**: Process ID
- **Uptime**: How long trading has been running
- **Enctoken**: Valid/Invalid

### Trading Controls

- **▶️ Start Trading**: Begin live/paper trading
- **⏹️ Stop Trading**: Stop immediately (confirms first)
- **🔄 Refresh Status**: Manual status update

---

## Step 10: Sit Back & Monitor

### What Happens Automatically?

✅ **Every 5 Minutes:**
- Bot checks enctoken validity
- If invalid: Trading stops, email sent, login modal shown

✅ **Every Hour:**
- Cache files older than 24 hours deleted

✅ **Every 5 Seconds:**
- Dashboard auto-refreshes status

### Mobile Access

**On Same WiFi:**
1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Open on mobile:
   ```
   http://YOUR_IP:3000
   ```

3. Dashboard is fully responsive on mobile!

---

## Common Issues & Solutions

### Issue 1: "Enctoken is expired or invalid"

**Solution:**
- Login modal will appear automatically
- Enter credentials and 2FA code
- Click "Login & Resume"

### Issue 2: "No historical data available"

**Solution:**
- First run fetches from Kite API (takes time)
- Subsequent runs use cache (faster)
- Wait for initial fetch to complete

### Issue 3: Dashboard not loading

**Solution:**
```bash
# Check if server is running
curl http://localhost:3000/health

# If not, start server:
node api-server.js
```

### Issue 4: Parameters not saving

**Solution:**
- Check browser's localStorage is enabled
- Try different browser
- Parameters save per-browser, per-device

### Issue 5: Email not received

**Solution:**
```bash
# Check configuration
curl http://localhost:3000/api/email/status

# Test email
curl -X POST http://localhost:3000/api/email/test

# Check spam folder
# Verify SMTP credentials correct
```

---

## Next Steps

### Optimize Parameters

Run multiple backtests with different parameters:

1. Change SL/Target ratio
2. Try different timeframes
3. Adjust risk percentage
4. Compare results

**Pro Tip:** Save backtest results before changing parameters:
```bash
cp backtest_results.json backtest_results_30_70.json
```

### Deploy to Cloud

Follow [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) for:
- Oracle Cloud Free Tier setup (24GB RAM, forever free!)
- Domain configuration
- SSL/HTTPS setup
- 24/7 operation

### Advanced Features

**Auto-restart on failure:**
Already built-in! Trading process auto-restarts if it crashes.

**Multiple instruments:**
Run separate instances for different instruments.

**Strategy modifications:**
Edit [kite.js](kite.js) to customize:
- EMA periods
- MACD settings
- RSI thresholds
- Entry/exit logic

---

## Quick Reference

### Essential Commands

```bash
# Start API server
node api-server.js

# Run backtest (CLI)
node kite.js --instrument 120395527 --notimeexit

# Check logs
tail -f logs/supervisor.log

# Test API
curl http://localhost:3000/api/status

# Stop server
Ctrl + C
```

### Essential URLs

```
Dashboard:        http://localhost:3000
Health Check:     http://localhost:3000/health
API Status:       http://localhost:3000/api/status
Enctoken Status:  http://localhost:3000/api/enctoken/status
Backtest Results: http://localhost:3000/api/backtest/results
```

### Key Files

```
.env.enctoken          - Enctoken storage
.env.email             - Email configuration
logs/supervisor.log    - All logs
cache/                 - Historical data cache
backtest_results.json  - Latest backtest results
```

---

## Keyboard Shortcuts

**In Dashboard:**

- `Ctrl + R` / `Cmd + R` - Refresh page
- `Ctrl + Shift + R` / `Cmd + Shift + R` - Hard refresh (clear cache)
- `F12` - Open browser console (for debugging)

---

## Success Checklist

- [ ] API server running
- [ ] Dashboard accessible at http://localhost:3000
- [ ] Enctoken valid (no login modal)
- [ ] Trading parameters configured and saved
- [ ] Backtest completed successfully
- [ ] Email alerts configured and tested
- [ ] Logs show activity
- [ ] System status shows "Connected"

**If all checked - you're ready to trade! 🎉**

---

## Daily Routine

### Morning (Before Market Opens)

1. **Start server** (if not running):
   ```bash
   node api-server.js
   ```

2. **Open dashboard**: http://localhost:3000

3. **Check enctoken**:
   - If login modal appears → Login
   - If not → Already valid

4. **Run backtest** (optional):
   - Test yesterday's performance
   - Adjust parameters if needed

5. **Start trading**:
   - Paper mode first (test)
   - Then live trading

### During Market Hours

- **Monitor dashboard** periodically
- **Check email** for alerts
- **Watch logs** for issues
- **Check positions** via Kite app

### After Market Close

1. **Stop trading** (if not auto-stopped)
2. **Review performance**
3. **Check logs** for errors
4. **Plan adjustments** for tomorrow

---

## Getting Help

### Documentation

- [NEW_FEATURES.md](NEW_FEATURES.md) - Latest features
- [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) - Email alerts
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [LOCAL_SETUP.md](LOCAL_SETUP.md) - Detailed local setup
- [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) - Cloud deployment
- [TROUBLESHOOT_BACKTEST.md](TROUBLESHOOT_BACKTEST.md) - Backtest issues

### Debug Mode

Enable detailed logging:
```bash
# Check browser console (F12)
# Check server logs
tail -f logs/supervisor.log

# Test specific API endpoint
curl -v http://localhost:3000/api/status
```

---

## Summary

**You now have:**

✅ Trading bot running with web dashboard
✅ Automatic enctoken monitoring
✅ Email alerts for critical events
✅ UI-based parameter configuration
✅ Backtest capabilities
✅ Live/paper trading modes
✅ Automatic cache cleanup
✅ Mobile-responsive interface

**Start with paper trading, test thoroughly, then go live!**

**Happy Trading! 📈🤖**

---

**Last Updated:** January 24, 2025
**Version:** 2.0.0
