# Local APK Build Guide (No Expo Account Required)

Build APK directly on your computer for personal use - no Expo account needed!

---

## Method 1: Expo Development Build (Recommended - Easiest)

This creates a development APK that you can install on your phone.

### Prerequisites

- Android phone with USB debugging enabled
- USB cable to connect phone to computer

### Step 1: Install Expo CLI

```bash
cd /Users/ankit/projects/test/kite-mobile
npm install
```

### Step 2: Generate Android Project Files

```bash
npx expo prebuild --platform android
```

This creates the native Android project in `android/` folder.

### Step 3: Build APK Locally

```bash
cd android
./gradlew assembleRelease
```

Or if that doesn't work:

```bash
cd android
chmod +x gradlew
./gradlew assembleRelease
```

**Build time:** 5-10 minutes

### Step 4: Find Your APK

The APK will be at:
```
kite-mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Step 5: Sign the APK (Optional but Recommended)

For personal use, the unsigned APK works. But if you want to sign it:

```bash
cd kite-mobile/android/app/build/outputs/apk/release

# Generate keystore (first time only)
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release.apk my-key-alias

# Verify
jarsigner -verify -verbose -certs app-release.apk
```

---

## Method 2: Using Android Studio (Most Control)

If you prefer a GUI and have Android Studio installed.

### Step 1: Generate Android Project

```bash
cd /Users/ankit/projects/test/kite-mobile
npx expo prebuild --platform android
```

### Step 2: Open in Android Studio

1. Open **Android Studio**
2. Click **Open an Existing Project**
3. Navigate to: `/Users/ankit/projects/test/kite-mobile/android`
4. Click **Open**

### Step 3: Build APK

1. In Android Studio menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build (5-10 minutes)
3. Click **locate** link in notification to find APK

---

## Method 3: Quick Development APK (Fastest)

Build a development APK quickly without signing.

### Step 1: Ensure Dependencies

```bash
cd /Users/ankit/projects/test/kite-mobile
npm install
npx expo install --check
```

### Step 2: Generate Android Files

```bash
npx expo prebuild --platform android
```

### Step 3: Build Debug APK

```bash
cd android
./gradlew assembleDebug
```

**APK location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

This APK is ready to install immediately!

---

## Installation on Phone

### Option A: Via USB (Easiest)

1. **Enable USB Debugging on phone:**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Go back → Developer Options → Enable "USB Debugging"

2. **Connect phone to computer via USB**

3. **Install APK:**
   ```bash
   # Check phone connected
   adb devices

   # Install APK
   cd /Users/ankit/projects/test/kite-mobile/android/app/build/outputs/apk

   # For release APK
   adb install release/app-release.apk

   # Or for debug APK
   adb install debug/app-debug.apk
   ```

### Option B: Manual Transfer

1. **Copy APK to phone:**
   ```bash
   # Via USB (phone will appear as storage device)
   # Copy APK to Download folder

   # Or use ADB push
   adb push android/app/build/outputs/apk/release/app-release.apk /sdcard/Download/
   ```

2. **On phone:**
   - Open Files app
   - Go to Downloads folder
   - Tap APK file
   - Tap "Install"

### Option C: Share via Cloud

1. Upload APK to Google Drive/Dropbox
2. Download on phone
3. Install

---

## Complete Build Script (Local)

Create a file `build-local.sh`:

```bash
#!/bin/bash

echo "======================================"
echo "Local APK Build (No Expo Account)"
echo "======================================"
echo ""

cd "$(dirname "$0")/kite-mobile"

echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Generating Android project..."
npx expo prebuild --platform android

echo ""
echo "Step 3: Building APK..."
cd android

# Make gradlew executable
chmod +x gradlew

# Build release APK
./gradlew assembleRelease

echo ""
echo "======================================"
echo "Build Complete!"
echo "======================================"
echo ""
echo "APK Location:"
echo "  $(pwd)/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "To install on phone:"
echo "  1. Enable USB debugging on phone"
echo "  2. Connect phone via USB"
echo "  3. Run: adb install app/build/outputs/apk/release/app-release.apk"
echo ""
```

### Make it executable and run:

```bash
chmod +x build-local.sh
./build-local.sh
```

---

## Troubleshooting

### "Android SDK not found"

**Solution:**

```bash
# Install Android SDK via Expo
npx expo install expo-dev-client

# Or download Android Studio which includes SDK
# https://developer.android.com/studio
```

### "gradlew: Permission denied"

**Solution:**

```bash
cd kite-mobile/android
chmod +x gradlew
./gradlew assembleRelease
```

### "Build failed: JAVA_HOME not set"

**Solution:**

```bash
# Mac with Homebrew
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17

# Or add to ~/.zshrc
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@17' >> ~/.zshrc
source ~/.zshrc
```

### "adb: command not found"

**Solution:**

```bash
# Mac with Homebrew
brew install android-platform-tools

# Or add Android SDK to PATH
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### "Device not found" with adb

**Solution:**

1. Enable USB debugging on phone
2. Unlock phone screen
3. Accept "Allow USB debugging" prompt
4. Run: `adb devices`

---

## Prerequisites for Local Build

### Required:

- **Node.js** (already installed)
- **npm** (already installed)
- **Android SDK** (install via Android Studio or `brew install android-sdk`)

### Optional but helpful:

- **Android Studio** - For GUI build
- **adb** (Android Debug Bridge) - For easy installation
  ```bash
  brew install android-platform-tools
  ```

---

## Comparison: Local vs Cloud Build

| Feature | Local Build | Cloud Build (Expo) |
|---------|-------------|-------------------|
| **Expo Account** | ❌ Not needed | ✅ Required |
| **Build Time** | 5-10 min | 10-20 min |
| **Build Location** | Your computer | Expo servers |
| **Internet Required** | Only for dependencies | For entire build |
| **Customization** | Full control | Limited |
| **APK Size** | ~25-30 MB | ~25-30 MB |
| **Difficulty** | Medium | Easy |

---

## Quick Commands Reference

```bash
# Full local build
cd kite-mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease

# Find APK
ls -lh app/build/outputs/apk/release/

# Install on phone (USB)
adb install app/build/outputs/apk/release/app-release.apk

# Or build debug (faster, no signing)
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## After Building

### APK Locations

**Release APK (recommended):**
```
kite-mobile/android/app/build/outputs/apk/release/app-release.apk
```

**Debug APK (faster build):**
```
kite-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### Installation

**Via USB:**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Manual:**
1. Copy APK to phone's Download folder
2. Open Files app
3. Tap APK → Install

---

## Next Steps After Installation

Same as cloud build:

1. **Find server IP:**
   ```bash
   ifconfig | grep "inet "
   ```

2. **Get API key:**
   ```bash
   cat .env | grep API_KEY
   ```

3. **Update CORS in `.env`:**
   ```bash
   ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.*
   ```

4. **Open app on phone:**
   - Enter server URL: `http://YOUR_IP:3000`
   - Enter API key
   - Test connection
   - Start using!

---

## Summary

**Easiest local method:**

```bash
cd kite-mobile
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

**No Expo account needed!** ✅

---

**Ready to build locally?**

Run:
```bash
cd /Users/ankit/projects/test
./build-local.sh
```

(I'll create this script for you next!)
