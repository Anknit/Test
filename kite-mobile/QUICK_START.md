# Mobile App Quick Start Guide

Get your Kite Trading Bot mobile app up and running in minutes!

---

## Prerequisites

- Android phone (Android 5.0+)
- Computer with Node.js installed
- Trading bot server running

---

## Method 1: Quick Testing (5 minutes)

Perfect for immediate testing without building APK.

### Step 1: Install Expo Go

On your Android phone:
1. Open **Google Play Store**
2. Search for **"Expo Go"**
3. Install the app

### Step 2: Start Development Server

On your computer:

```bash
cd kite-mobile
npm install
npm start
```

### Step 3: Connect Your Phone

1. Open **Expo Go** on your phone
2. Tap **"Scan QR Code"**
3. Scan the QR code from your computer terminal
4. App will load on your phone!

**Note:** Phone and computer must be on same WiFi network.

---

## Method 2: Build APK (30 minutes)

Creates standalone APK for permanent installation.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

Create free account at https://expo.dev/signup, then:

```bash
eas login
```

### Step 3: Build APK

```bash
cd kite-mobile
eas build --platform android --profile preview
```

Wait 10-15 minutes for build to complete.

### Step 4: Download & Install

1. **Download APK** from link provided by EAS
2. On your phone:
   - Settings > Security > Enable "Install unknown apps"
3. **Open APK file** on phone
4. **Tap "Install"**
5. **Launch app**

---

## First-Time Setup

### Step 1: Find Your Server IP

On your server computer:

**Mac/Linux:**
```bash
ifconfig | grep inet
```

**Windows:**
```cmd
ipconfig
```

Look for IP like `192.168.1.100` or `10.0.0.100`

### Step 2: Get API Key

On your server:

```bash
# Start server
node api-server.js

# Copy the API key shown in startup logs
# Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
```

Or check `.env` file:
```bash
cat .env | grep API_KEY
```

### Step 3: Configure App

Open the app on your phone:

1. **Server URL:** `http://192.168.1.100:3000`
   - Replace `192.168.1.100` with your server IP
   - Must include `http://` or `https://`
   - Include port (default: 3000)

2. **API Key:** Paste the 64-character key from server

3. **Test Connection:** Tap to verify

4. **Continue:** If successful, proceed to main app

---

## Backend Configuration

### Update CORS Settings

On your server, edit `.env` file:

```bash
# Add your phone's IP range
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.*
```

**Restart server:**
```bash
node api-server.js
```

---

## Quick Test

### Test Server Connection

From your phone's browser:
```
http://YOUR_SERVER_IP:3000/health
```

Should show:
```json
{"status":"ok","timestamp":"2025-01-24T..."}
```

### Test in App

1. **Dashboard:** Should show trading status
2. **Trading:** Try changing parameters (don't start yet)
3. **Logs:** Should display recent logs
4. **Settings:** Check connection info

---

## Common Issues

### "Connection Failed"

✅ Check server is running
✅ Verify IP address is correct
✅ Ensure phone and server on same WiFi
✅ Try accessing server URL in phone browser

### "Unauthorized"

✅ Verify API key is correct (64 characters)
✅ Check `.env` file on server
✅ Restart server
✅ Logout and setup again in app

### "No response from server"

✅ Check WiFi connection
✅ Ping server from phone browser
✅ Check firewall on server
✅ Restart both app and server

---

## App Features

### Dashboard
- Real-time trading status
- Process info (PID, uptime, memory)
- Enctoken validity check
- Auto-refresh every 5 seconds

### Trading
- Configure parameters (instrument, capital, SL, target)
- Start/Stop/Restart trading
- Paper trading mode
- Input validation

### Backtest
- Run historical backtests
- View win rate and P&L
- Test different parameters

### Logs
- Real-time log viewing
- Filter by ERROR/WARN/INFO
- Search logs
- Auto-refresh toggle

### Settings
- Login to Kite (update enctoken)
- Configure email alerts
- Clear cache and logs
- View connection info
- Logout

---

## Next Steps

1. ✅ Install app (via Expo Go or APK)
2. ✅ Complete setup (server URL + API key)
3. ⚠️ Test all features
4. ⚠️ Configure email alerts (Settings)
5. ⚠️ Test paper trading first
6. ⚠️ Start live trading when ready

---

## Additional Resources

- **Complete Build Guide:** [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md)
- **App Overview:** [README.md](README.md)
- **Backend Docs:** [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- **Security Guide:** [../SECURITY_SETUP_GUIDE.md](../SECURITY_SETUP_GUIDE.md)

---

## Support

**Test server manually:**
```bash
# Health check
curl http://YOUR_SERVER_IP:3000/health

# Status check (with API key)
curl -H "X-API-Key: YOUR_KEY" http://YOUR_SERVER_IP:3000/api/status
```

**Check logs:**
```bash
# Server logs
tail -f logs/supervisor.log

# Security logs
tail -f logs/security.log
```

---

**Happy Trading!** 📈📱

