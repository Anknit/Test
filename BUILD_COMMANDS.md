# Quick Build Commands Reference

## 🚀 Quick Start (Automated)

```bash
# Run the automated build script
./build-mobile.sh
```

This script will:
- ✅ Check dependencies
- ✅ Check EAS CLI
- ✅ Verify Expo login
- ✅ Start APK build

---

## 📋 Manual Build Steps

### 1. Prerequisites

```bash
# Install dependencies (if not done)
cd kite-mobile
npm install

# Install EAS CLI globally (if not done)
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

Enter your Expo credentials. Don't have an account? Create one at: https://expo.dev/signup

### 3. Build APK

```bash
cd kite-mobile
eas build --platform android --profile preview
```

**Expected time:** 10-20 minutes

---

## 📱 Installation on Phone

### Quick Steps

1. **Download APK** from build link
2. **Enable installation:**
   - Settings → Security → Install unknown apps
   - Enable for Chrome or Files app
3. **Install APK** by opening the file
4. **Launch app**

---

## ⚙️ App Setup

### First Launch

1. **Server URL:** `http://YOUR_SERVER_IP:3000`
   ```bash
   # Find your server IP:
   ifconfig | grep "inet "  # Mac/Linux
   ipconfig                  # Windows
   ```

2. **API Key:** Get from server logs or `.env` file
   ```bash
   # Start server
   node api-server.js

   # Or check .env
   cat .env | grep API_KEY
   ```

3. **Test Connection** in app
4. **Continue** to main app

---

## 🔧 Backend Configuration

Update `.env` file to allow mobile connections:

```bash
# Add mobile device IP range
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.*
```

Restart server:
```bash
node api-server.js
```

---

## ✅ Verify Installation

### Test from Phone Browser

```
http://YOUR_SERVER_IP:3000/health
```

Should show:
```json
{"status":"ok","timestamp":"..."}
```

### Test in App

- ✅ Dashboard loads
- ✅ Logs display
- ✅ Trading screen accessible
- ✅ Settings work

---

## 🐛 Quick Troubleshooting

### Build Issues

```bash
# Check login
eas whoami

# Build with clean cache
eas build --platform android --profile preview --clear-cache

# Check build status
eas build:list
```

### Connection Issues

```bash
# Is server running?
ps aux | grep api-server

# Test server
curl http://192.168.1.100:3000/health

# Check server logs
tail -f logs/supervisor.log
```

### Installation Issues

- **"Install blocked"** → Enable "Install unknown apps" in Settings
- **"App not installed"** → Uninstall old version, reinstall
- **"Connection failed"** → Check server IP and network

---

## 📚 Full Documentation

- **Comprehensive Guide:** [INSTALL_APK.md](INSTALL_APK.md)
- **Build Guide:** [kite-mobile/ANDROID_BUILD_GUIDE.md](kite-mobile/ANDROID_BUILD_GUIDE.md)
- **Quick Start:** [kite-mobile/QUICK_START.md](kite-mobile/QUICK_START.md)
- **App README:** [kite-mobile/README.md](kite-mobile/README.md)

---

## 🎯 Build Profiles

```bash
# Preview (recommended for personal use)
eas build --platform android --profile preview

# Production (optimized, minified)
eas build --platform android --profile production

# Development (with dev tools)
eas build --platform android --profile development
```

---

## 🆘 Need Help?

1. **Check guides:** See documentation links above
2. **Check logs:** `tail -f logs/supervisor.log`
3. **Test server:** `curl http://SERVER_IP:3000/health`
4. **Check build:** `eas build:list`

---

**Ready to build?**

```bash
./build-mobile.sh
```

or

```bash
cd kite-mobile
eas login
eas build --platform android --profile preview
```

📱 Happy Trading!
