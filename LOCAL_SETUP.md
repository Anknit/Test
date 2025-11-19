# Run Locally - Quick Guide

## 🏠 Running Your Kite Trading Bot Locally

This guide shows how to run the bot on your local machine (Mac/Linux/Windows) right now.

---

## 🚀 Quick Start (5 Minutes)

### 1. Check Prerequisites

```bash
# Check if Node.js is installed
node --version
# Should show v18 or higher

# If not installed, install Node.js from: https://nodejs.org
```

### 2. Install Dependencies

```bash
# Navigate to project directory
cd /Users/ankit/projects/test

# Install dependencies
npm install
```

### 3. Create Enctoken File

```bash
# Create the enctoken file
echo 'ENCTOKEN="your_enctoken_here"' > .env.enctoken

# Secure it
chmod 600 .env.enctoken
```

**How to get enctoken:**
- Login to kite.zerodha.com
- Press F12 → Application → Cookies
- Copy `enctoken` value
- OR use the auto-login API (see below)

### 4. Start the API Server

```bash
# Option A: Using the startup script
./start-api.sh

# Option B: Direct command
node api-server.js

# Option C: Using npm
npm start
```

You should see:
```
🚀 Kite Trading API Server
📡 Listening on http://0.0.0.0:3000

Available endpoints:
  GET  /health
  GET  /api/status
  POST /api/trading/start
  ...
```

### 5. Open Dashboard

Open your browser and go to:
```
http://localhost:3000
```

🎉 **That's it! Your dashboard is running locally!**

---

## 📊 What You Can Do Now

### 1. Auto-Login to Get Enctoken

1. Open: http://localhost:3000
2. Fill the **Auto-Login** form:
   - User ID: Your Kite user ID (e.g., AB1234)
   - Password: Your Kite password
   - 2FA Code: Get from authenticator app
3. Click "Login & Fetch Enctoken"
4. Wait 2-3 seconds
5. ✅ Enctoken updated automatically!

### 2. Start Trading

1. In the **Trading Controls** section:
   - Instrument Token: 120395527 (SILVER futures)
   - Trading Symbol: SILVERM25FEBFUT
   - Enable "Paper Trading Mode" for testing
   - Enable "Disable Time Exit"
2. Click "▶️ Start Trading"
3. Monitor the **Logs** tab

### 3. View Logs

1. Click the "📝 Logs" tab
2. See real-time logs
3. Use filter to search
4. Adjust number of lines

### 4. Run Backtest

1. Set parameters (instrument, symbol)
2. Click "🧪 Run Backtest" in sidebar
3. Wait for completion
4. View results in "📊 Backtest Results" tab

### 5. Stop Trading

1. Click "⏹️ Stop Trading"
2. Confirm
3. Done!

---

## 🎯 Local Access Points

### Dashboard (Web UI)
```
http://localhost:3000
```

### API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# System status
curl http://localhost:3000/api/status

# Enctoken status
curl http://localhost:3000/api/enctoken/status

# Logs
curl http://localhost:3000/api/logs?lines=50
```

---

## 📱 Access from Mobile on Same Network

If you want to access from your phone while on the same WiFi:

### 1. Find Your Computer's IP Address

**Mac:**
```bash
ipconfig getifaddr en0
# or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

**Windows:**
```cmd
ipconfig
# Look for IPv4 Address
```

### 2. Update API Server

Edit `api-server.js`:
```javascript
// Change from:
app.listen(PORT, '0.0.0.0', () => {

// Already set to 0.0.0.0, so it should work!
```

### 3. Allow Firewall Access

**Mac:**
```
System Settings → Network → Firewall
→ Allow incoming connections for Node.js
```

**Linux:**
```bash
sudo ufw allow 3000/tcp
```

**Windows:**
```
Windows Defender Firewall → Allow an app
→ Add Node.js
```

### 4. Access from Phone

Open browser on phone:
```
http://YOUR_COMPUTER_IP:3000
```

Example:
```
http://192.168.1.100:3000
```

---

## 🔧 Different Ways to Run

### Option 1: Direct Node.js (Simplest)

```bash
cd /Users/ankit/projects/test
node api-server.js
```

**Pros:**
- Simple and direct
- Easy to debug
- See logs in terminal

**Cons:**
- Stops when terminal closes
- No auto-restart

### Option 2: With Supervisor Script

```bash
cd /Users/ankit/projects/test
node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT
```

**Pros:**
- Auto-restart on crash
- Health monitoring
- Better for production

**Cons:**
- More complex setup

### Option 3: Using npm Scripts

```bash
# Start API server
npm start

# Run trading directly (not recommended)
npm run trade

# Run with supervisor
npm run supervisor
```

### Option 4: With Docker (If installed)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Pros:**
- Consistent environment
- Easy deployment
- Isolated from system

**Cons:**
- Requires Docker installed

### Option 5: In Background (Screen/Tmux)

**Using screen:**
```bash
# Start screen session
screen -S trading-bot

# Run the server
node api-server.js

# Detach: Press Ctrl+A then D
# Reattach: screen -r trading-bot
```

**Using tmux:**
```bash
# Start tmux session
tmux new -s trading-bot

# Run the server
node api-server.js

# Detach: Press Ctrl+B then D
# Reattach: tmux attach -t trading-bot
```

---

## 🎮 Complete Local Workflow

### Morning Routine

```bash
# 1. Navigate to project
cd /Users/ankit/projects/test

# 2. Start API server
./start-api.sh

# 3. Open browser
open http://localhost:3000

# 4. In dashboard:
#    - Use Auto-Login to update enctoken
#    - Set trading parameters
#    - Start trading

# 5. Monitor logs in browser
```

### During Market Hours

```bash
# Check status
curl http://localhost:3000/api/status | jq

# View recent logs
curl http://localhost:3000/api/logs?lines=50 | jq

# Or just use the dashboard in browser
```

### After Market Close

```bash
# Stop trading via dashboard
# Or via API:
curl -X POST http://localhost:3000/api/trading/stop

# Run backtest
curl -X POST http://localhost:3000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'

# View results in dashboard
```

---

## 📝 Daily Enctoken Update

### Method 1: Using Dashboard (Easiest)

1. Open http://localhost:3000
2. Fill Auto-Login form
3. Click Login
4. Done! (2-3 seconds)

### Method 2: Using Script

```bash
./daily-trading.sh
# Choose option 1 (Auto-login)
# Enter credentials
# Done!
```

### Method 3: Manual Update

```bash
# Get enctoken from Kite website
# Then:
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "YOUR_NEW_ENCTOKEN"}'
```

---

## 🧪 Testing Features

### 1. Test Auto-Login

```bash
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "AB1234",
    "password": "your_password",
    "totp": "123456"
  }'
```

### 2. Test Trading Start

```bash
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "paper": true,
    "notimeexit": true
  }'
```

### 3. Test Backtest

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

## 🔍 Monitoring

### View Logs in Terminal

```bash
# Follow app logs
tail -f logs/supervisor.log

# Filter for errors
tail -f logs/supervisor.log | grep ERROR

# Filter for trades
tail -f logs/supervisor.log | grep "SIGNAL\|ORDER"
```

### Check Process Status

```bash
# Check if running
ps aux | grep api-server.js

# Check port usage
lsof -i :3000

# Check memory usage
ps aux | grep node
```

---

## 🆘 Troubleshooting

### Port 3000 Already in Use

```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 PID

# Or use different port
PORT=3001 node api-server.js
```

### Dashboard Not Loading

```bash
# Check if server is running
curl http://localhost:3000/health

# Check browser console (F12)
# Look for errors

# Restart server
# Ctrl+C to stop, then:
node api-server.js
```

### Enctoken Not Valid

```bash
# Check enctoken file
cat .env.enctoken

# Update via API
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "AB1234", "password": "pass", "totp": "123456"}'
```

### Trading Won't Start

```bash
# Check logs
curl http://localhost:3000/api/logs?filter=ERROR

# Check enctoken status
curl http://localhost:3000/api/enctoken/status

# Check if cache exists
ls -la cache/

# Try running backtest first
curl -X POST http://localhost:3000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{"instrument": "120395527", "tradingsymbol": "SILVERM25FEBFUT"}'
```

### Module Not Found Error

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Directory Structure

```
/Users/ankit/projects/test/
├── api-server.js          # Main API server (run this!)
├── kite.js               # Trading logic
├── supervisor.js         # Process supervisor
├── package.json          # Dependencies
├── .env.enctoken         # Your enctoken (create this)
├── public/               # Web dashboard
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── logs/                 # Log files
│   └── supervisor.log
├── cache/                # Cached data
│   └── cache_*.json
└── enctoken_backups/     # Enctoken backups
    └── enctoken_*.bak
```

---

## 🎯 Quick Commands Reference

```bash
# Start server
node api-server.js

# Start with logs
node api-server.js 2>&1 | tee logs/app.log

# Start in background
nohup node api-server.js > logs/app.log 2>&1 &

# Stop background process
pkill -f api-server.js

# Check if running
ps aux | grep api-server

# View logs
tail -f logs/supervisor.log

# Clear logs
> logs/supervisor.log

# Clear cache
rm -rf cache/*

# Update enctoken
./daily-trading.sh

# Run backtest
curl -X POST localhost:3000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{"instrument":"120395527","tradingsymbol":"SILVERM25FEBFUT","notimeexit":true}'
```

---

## 💡 Pro Tips

### 1. Use Multiple Terminals

**Terminal 1: Run server**
```bash
node api-server.js
```

**Terminal 2: Monitor logs**
```bash
tail -f logs/supervisor.log
```

**Terminal 3: Test APIs**
```bash
curl http://localhost:3000/api/status
```

### 2. Create Aliases

Add to `~/.zshrc` or `~/.bashrc`:

```bash
alias trading-start='cd /Users/ankit/projects/test && node api-server.js'
alias trading-logs='tail -f /Users/ankit/projects/test/logs/supervisor.log'
alias trading-status='curl -s http://localhost:3000/api/status | jq'
```

Then just use:
```bash
trading-start
trading-logs
trading-status
```

### 3. VS Code Integration

Open in VS Code:
```bash
code /Users/ankit/projects/test
```

Use integrated terminal (Ctrl+` ) to run:
```bash
npm start
```

### 4. Keep Terminal Open

Prevent sleep:
```bash
caffeinate -i node api-server.js
```

---

## 🔒 Local Security

**Since running locally, security is less critical, but still:**

1. **Keep .env.enctoken secure**
   ```bash
   chmod 600 .env.enctoken
   ```

2. **Don't commit sensitive files**
   ```bash
   # Already in .gitignore:
   .env.enctoken
   logs/
   cache/
   enctoken_backups/
   ```

3. **Backup enctoken backups**
   ```bash
   cp -r enctoken_backups ~/Backups/
   ```

---

## ✅ Quick Start Checklist

- [ ] Node.js installed (v18+)
- [ ] Project dependencies installed (`npm install`)
- [ ] `.env.enctoken` file created
- [ ] Server starts without errors (`node api-server.js`)
- [ ] Dashboard loads in browser (`http://localhost:3000`)
- [ ] Can login and update enctoken
- [ ] Can start/stop trading
- [ ] Logs are visible

---

## 🎉 You're Running Locally!

**Access points:**
- Dashboard: http://localhost:3000
- API: http://localhost:3000/api
- Health: http://localhost:3000/health

**Next steps:**
1. Update enctoken using Auto-Login
2. Run a backtest to test everything
3. Start paper trading
4. Monitor logs
5. When confident, switch to live trading

**Happy Trading! 🚀📈**
