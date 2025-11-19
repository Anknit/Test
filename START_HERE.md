# 🚀 START HERE - Build & Install Mobile App

## ✨ Build APK Without Expo Account (Personal Use Only)

Perfect! You can build the APK locally on your Mac without any Expo account.

---

## 🎯 Quick Start (5 Steps)

### Step 1: Run Build Script

```bash
cd /Users/ankit/projects/test
./build-local.sh
```

**What happens:**
- ✅ Checks dependencies
- ✅ Generates Android project
- ✅ Builds APK on your Mac
- ⏱️ Takes 5-10 minutes

### Step 2: Wait for Build

The script will show progress. Grab a coffee! ☕

### Step 3: Get APK

APK location:
```
/Users/ankit/projects/test/kite-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Size: ~25-30 MB

### Step 4: Install on Phone

**Option A: USB (Easiest)**

Enable USB debugging on phone, then:
```bash
adb install kite-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

**Option B: Manual**

1. Copy APK to phone's Download folder
2. On phone: Files → Downloads → Tap APK
3. Tap "Install"

### Step 5: Setup App

1. **Find server IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Shows something like: 192.168.1.100
   ```

2. **Get API key:**
   ```bash
   cat .env | grep API_KEY
   ```

3. **Open app on phone:**
   - Enter: `http://YOUR_IP:3000`
   - Enter: API key
   - Test connection
   - Start using!

---

## 📚 Documentation

### Quick Guides
- **[BUILD_WITHOUT_EXPO.md](BUILD_WITHOUT_EXPO.md)** ⭐ START HERE for no-account build
- **[BUILD_COMMANDS.md](BUILD_COMMANDS.md)** - Quick command reference

### Detailed Guides
- **[LOCAL_BUILD_GUIDE.md](LOCAL_BUILD_GUIDE.md)** - Complete local build guide
- **[INSTALL_APK.md](INSTALL_APK.md)** - Detailed installation steps
- **[kite-mobile/QUICK_START.md](kite-mobile/QUICK_START.md)** - App quick start

### Reference
- **[kite-mobile/README.md](kite-mobile/README.md)** - App overview
- **[MOBILE_APP_SUMMARY.md](MOBILE_APP_SUMMARY.md)** - Complete feature summary

---

## 🆘 Troubleshooting

### Build fails with "Java not found"

```bash
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
./build-local.sh
```

### "Permission denied" error

```bash
chmod +x build-local.sh
./build-local.sh
```

### Can't install on phone

1. Settings → Security → Install unknown apps
2. Enable for Files or Chrome app
3. Try installation again

### "Connection Failed" in app

1. Check server is running: `ps aux | grep api-server`
2. Verify IP: `ifconfig | grep inet`
3. Test in phone browser: `http://YOUR_IP:3000/health`
4. Update CORS in `.env`:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.*
   ```
5. Restart server: `node api-server.js`

---

## ✅ Prerequisites

### You Already Have ✅
- Node.js
- npm
- Project dependencies

### Script Will Handle
- Java JDK (auto-installs if needed)
- Android build tools
- APK generation

### Optional (For USB Install)
```bash
brew install android-platform-tools
```

---

## 🎯 What You're Building

**Native Android App** with:
- 📊 Real-time dashboard
- 🎯 Trading controls (start/stop/restart)
- 📈 Backtesting
- 📝 Live log viewing
- ⚙️ Settings management
- 🔒 Secure encrypted storage

**No limitations!** Full features, works offline after install.

---

## 📋 Build Options Comparison

| Feature | Local Build | Cloud Build |
|---------|-------------|-------------|
| **Expo Account** | ❌ Not needed | ✅ Required |
| **Build Time** | 5-10 min | 10-20 min |
| **Where** | Your Mac | Expo servers |
| **Internet** | Only once | Required |
| **Privacy** | 100% local | Uploaded to cloud |
| **Control** | Full | Limited |

**Recommendation:** Use local build! No account, faster, more private.

---

## 🚀 Ready? Run This:

```bash
cd /Users/ankit/projects/test
./build-local.sh
```

**That's it!** Script guides you through everything.

---

## 📱 After Installation

### Backend Config

Edit `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.*
```

Restart server:
```bash
node api-server.js
```

### First Launch

1. Open app on phone
2. Enter server URL: `http://YOUR_IP:3000`
3. Enter API key (from `.env` or server logs)
4. Test connection
5. Success! Start trading 📈

---

## 🎓 Learning More

### Video Tutorial
Watch the build process in the script - it explains each step!

### Testing First
Use Expo Go for instant testing (no build needed):
```bash
cd kite-mobile
npm start
# Scan QR with Expo Go app
```

### Both Options
You can build both locally AND with cloud if you want backup!

---

## 💡 Pro Tips

1. **First build takes longer** (downloads dependencies)
2. **Debug APK is fine** for personal use
3. **Keep APK file** for easy reinstall
4. **USB install is fastest** if you have adb
5. **Test connection in browser first** before app setup

---

## 🎉 Success Checklist

- [ ] Run `./build-local.sh`
- [ ] Wait 5-10 minutes for build
- [ ] APK file created successfully
- [ ] APK installed on phone
- [ ] App launched
- [ ] Server URL entered
- [ ] API key entered
- [ ] Connection test passed
- [ ] Dashboard loads
- [ ] Ready to trade!

---

## 📞 Need Help?

### Check These First:
1. [BUILD_WITHOUT_EXPO.md](BUILD_WITHOUT_EXPO.md) - Common issues
2. [LOCAL_BUILD_GUIDE.md](LOCAL_BUILD_GUIDE.md) - Detailed troubleshooting
3. Server logs: `tail -f logs/supervisor.log`

### Test Commands:
```bash
# Is server running?
ps aux | grep api-server

# Test server
curl http://YOUR_IP:3000/health

# Check APK exists
ls -lh kite-mobile/android/app/build/outputs/apk/debug/

# Check phone connected
adb devices
```

---

**🚀 Start Building Now:**

```bash
./build-local.sh
```

No Expo account needed! ✅
Builds in 5-10 minutes! ⚡
Works on any Android 5.0+ phone! 📱
100% free and private! 🔒

Happy Trading! 📈🎉
