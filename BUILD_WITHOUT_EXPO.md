# Build APK Without Expo Account

## ✅ YES! You can build locally for personal use only.

No Expo account needed. APK builds on your computer.

---

## 🚀 Quick Start (Automated)

```bash
cd /Users/ankit/projects/test
./build-local.sh
```

**This script will:**
1. ✅ Check all dependencies
2. ✅ Generate Android project
3. ✅ Build APK locally on your Mac
4. ✅ Help you install on phone

**Build time:** 5-10 minutes
**No internet needed** after initial dependency install

---

## 📋 Manual Build (If you prefer)

### Step 1: Generate Android Project

```bash
cd /Users/ankit/projects/test/kite-mobile
npx expo prebuild --platform android
```

### Step 2: Build APK

```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

### Step 3: Get APK

APK location:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 Install on Phone

### Method 1: USB (Easiest)

```bash
# Install adb if needed
brew install android-platform-tools

# Connect phone via USB
# Enable USB debugging on phone

# Install APK
cd /Users/ankit/projects/test/kite-mobile/android
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: Manual Transfer

1. Copy APK to phone's Download folder
2. On phone: Open Files → Downloads
3. Tap APK file
4. Tap "Install"

---

## ⚙️ Prerequisites

### Required (likely already have):
- ✅ Node.js (you have it)
- ✅ npm (you have it)

### Optional (script will help install):
- Java JDK 11+ (script installs if needed)
- adb tools (for USB install)

---

## 🆚 Comparison

| Feature | Local Build | Cloud Build |
|---------|-------------|-------------|
| Expo Account | ❌ No | ✅ Required |
| Build Time | 5-10 min | 10-20 min |
| Build Location | Your Mac | Expo Servers |
| Internet | Only once | Required |
| Control | Full | Limited |

---

## 🎯 What You Get

**APK File:**
- Size: ~25-30 MB
- Type: Debug (for testing) or Release (optimized)
- Works on: Any Android 5.0+ device
- Signed: Self-signed (fine for personal use)

**App Features:**
- ✅ All features work exactly the same
- ✅ Real-time dashboard
- ✅ Trading controls
- ✅ Backtesting
- ✅ Log viewing
- ✅ Settings management

---

## 🐛 If Build Fails

### "Java not found"

```bash
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
```

### "gradlew: Permission denied"

```bash
cd kite-mobile/android
chmod +x gradlew
./gradlew assembleDebug
```

### "Android SDK not found"

Download Android Studio (includes SDK):
https://developer.android.com/studio

Or install via Homebrew:
```bash
brew install --cask android-studio
```

---

## 📚 Detailed Guides

- **[LOCAL_BUILD_GUIDE.md](LOCAL_BUILD_GUIDE.md)** - Complete local build guide
- **[BUILD_COMMANDS.md](BUILD_COMMANDS.md)** - Quick command reference
- **[kite-mobile/README.md](kite-mobile/README.md)** - App overview

---

## ✨ Summary

**Build locally without Expo account:**

```bash
./build-local.sh
```

**APK will be at:**
```
kite-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

**Install on phone:**
```bash
adb install kite-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

**That's it!** No Expo account needed. ✅

---

## 🎯 Next Steps

1. **Run build script:**
   ```bash
   ./build-local.sh
   ```

2. **Wait 5-10 minutes** for build

3. **Install on phone** (script will help)

4. **Setup app:**
   - Server URL: `http://YOUR_IP:3000`
   - API key from: `cat .env | grep API_KEY`

5. **Start trading!** 📈

---

**Ready? Run:**

```bash
cd /Users/ankit/projects/test
./build-local.sh
```

No Expo account required! 🎉
