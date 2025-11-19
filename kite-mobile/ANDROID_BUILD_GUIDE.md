# Android Build & Installation Guide

Complete guide to build and install the Kite Trading Bot mobile app on your Android phone.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Method 1: Build APK with Expo (Recommended)](#method-1-build-apk-with-expo-recommended)
3. [Method 2: Development Build with Expo Go](#method-2-development-build-with-expo-go)
4. [Installing APK on Android](#installing-apk-on-android)
5. [App Setup & Configuration](#app-setup--configuration)
6. [Backend Server Configuration](#backend-server-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### On Your Computer

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (will be installed)
- **EAS CLI** (for building APK)

### On Your Android Phone

- **Android 5.0 (Lollipop)** or higher
- **Stable internet connection**
- **At least 100MB free space**

---

## Method 1: Build APK with Expo (Recommended)

This method creates a standalone APK file that can be installed directly on your phone without Expo Go.

### Step 1: Install Dependencies

```bash
cd kite-mobile
npm install
```

### Step 2: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 3: Login to Expo

Create a free Expo account if you don't have one: https://expo.dev/signup

```bash
eas login
```

### Step 4: Configure EAS Build

Initialize EAS in your project:

```bash
eas build:configure
```

This creates an `eas.json` file.

### Step 5: Build APK for Android

Build the APK (this happens on Expo's servers):

```bash
eas build --platform android --profile preview
```

**Options explained:**
- `--platform android`: Build for Android
- `--profile preview`: Creates a development build (includes dev tools)

For production (final release):
```bash
eas build --platform android --profile production
```

### Step 6: Download APK

When the build completes (takes 10-15 minutes), you'll get a download link:

```
✔ Build finished
  https://expo.dev/accounts/your-account/projects/kite-trading-bot/builds/abc123

Download URL:
  https://expo.dev/artifacts/eas/abc123.apk
```

Download the APK file to your computer or directly on your phone.

---

## Method 2: Development Build with Expo Go

For quick testing without building APK (requires Expo Go app on phone).

### Step 1: Install Expo Go on Phone

Download from Google Play Store:
https://play.google.com/store/apps/details?id=host.exp.exponent

### Step 2: Start Development Server

```bash
cd kite-mobile
npm start
```

Or with Expo CLI:
```bash
npx expo start
```

### Step 3: Scan QR Code

- A QR code will appear in your terminal
- Open Expo Go on your phone
- Tap "Scan QR Code"
- Scan the QR code from your computer screen

**Note:** Your phone and computer must be on the same WiFi network.

---

## Installing APK on Android

### Step 1: Enable Unknown Sources

1. Go to **Settings** > **Security** (or **Privacy**)
2. Enable **Install unknown apps** (or **Unknown sources**)
3. Select your **File Manager** or **Browser** and enable installation

On Android 8.0+:
- Settings > Apps > Special app access > Install unknown apps
- Select the app you'll use to install (e.g., Chrome, Files)
- Toggle "Allow from this source"

### Step 2: Transfer APK to Phone

**Option A: Download Directly on Phone**
- Use the download link from EAS build
- Open the link in your phone's browser
- APK will download

**Option B: Transfer via USB**
1. Connect phone to computer with USB cable
2. Copy APK file to phone's Download folder
3. Use file manager on phone to find the APK

**Option C: Use Cloud Storage**
1. Upload APK to Google Drive/Dropbox
2. Download on phone from the cloud storage app

### Step 3: Install APK

1. Open the APK file using your file manager
2. Tap "Install"
3. If prompted, confirm permissions
4. Wait for installation to complete
5. Tap "Open" to launch the app

---

## App Setup & Configuration

### First Launch Setup

When you open the app for the first time:

1. **Setup Screen** will appear
2. Enter your **Server URL**:
   ```
   http://192.168.1.100:3000
   ```
   (Replace with your actual server IP address)

3. Enter your **API Key**:
   - Get this from your server startup logs
   - Or from your `.env` file on the server
   - Should be a 64-character hexadecimal string

4. Tap **"Test Connection"**
   - App will verify it can reach your server
   - If successful, you'll see a success message

5. Tap **"Continue"** to proceed to the main app

### Finding Your Server IP Address

**On Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter

**On Mac/Linux:**
```bash
ifconfig
```
Or:
```bash
ip addr show
```

**On the Server Machine:**
- The IP address should be something like `192.168.1.x` or `10.0.0.x`
- Make sure your phone and server are on the same network

---

## Backend Server Configuration

### Update CORS Settings

Your backend server needs to allow connections from the mobile app.

1. Edit `.env` file on your server:

```bash
# Add your phone's IP or use wildcard for local network
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:8081,http://192.168.1.*
```

2. Restart the API server:

```bash
node api-server.js
```

### Ensure Server is Running

Make sure your trading bot server is running and accessible:

```bash
# On server machine
node api-server.js
```

You should see:
```
🚀 Server running on http://0.0.0.0:3000
🔐 API KEY GENERATED
======================================================================
API Key: your-api-key-here
```

### Test Server Connection

From your phone's browser, try accessing:
```
http://YOUR_SERVER_IP:3000/health
```

You should see:
```json
{"status":"ok","timestamp":"2025-01-24T..."}
```

---

## App Usage Guide

### Dashboard Screen

- View trading status (running/stopped)
- Monitor process uptime and memory usage
- Check enctoken validity
- Auto-refreshes every 5 seconds

### Trading Screen

- Configure trading parameters:
  - Instrument token (NIFTY BANK: 120395527)
  - Capital amount
  - Timeframe (3/5/15/30/60 minutes)
  - Stop loss ticks
  - Target ticks
  - Risk percentage
- Start/Stop/Restart trading bot
- Enable paper trading (demo mode)

### Backtest Screen

- Run historical backtests
- Test different parameter combinations
- View win rate and P&L results

### Logs Screen

- View real-time logs
- Filter by ERROR/WARN/INFO
- Search logs
- Auto-refresh toggle
- Adjust number of lines displayed

### Settings Screen

- **Login to Kite**: Update enctoken when expired
- **Email Alerts**: Configure SMTP for email notifications
- **Maintenance**: Clear cache and logs
- **App Info**: View server connection details
- **Logout**: Clear credentials and return to setup

---

## Troubleshooting

### Issue: "Connection Failed" during setup

**Solution:**
1. Verify server is running: `node api-server.js`
2. Check server IP address is correct
3. Ensure phone and server are on same network
4. Try accessing `http://SERVER_IP:3000/health` in phone browser
5. Check firewall on server machine isn't blocking port 3000

### Issue: "Unauthorized. API key required"

**Solution:**
1. Verify API key is correct (64 characters)
2. Check `.env` file on server has correct API_KEY
3. Restart server after changing API key
4. In app Settings > Logout, then setup again with new API key

### Issue: "No response from server"

**Solution:**
1. Check internet/WiFi connection on phone
2. Verify server is running and accessible
3. Ping server from phone: Open browser, go to `http://SERVER_IP:3000/health`
4. Check firewall settings on server
5. Try restarting both app and server

### Issue: App keeps showing Setup screen

**Solution:**
1. Complete the setup process fully
2. Make sure "Test Connection" succeeds before continuing
3. Check app has storage permissions (Settings > Apps > Kite Trading Bot > Permissions)
4. Clear app data and try setup again

### Issue: "Enctoken Expired" warning

**Solution:**
1. Go to Settings screen
2. Tap "Login to Kite"
3. Enter your Zerodha credentials:
   - User ID (e.g., AB1234)
   - Password
   - 2FA code from your authenticator app
4. Tap "Login"
5. Enctoken will be automatically updated

### Issue: Logs not loading

**Solution:**
1. Check server is generating logs
2. Verify API key authentication is working
3. Try refreshing logs manually
4. Check server logs folder exists and has permissions

### Issue: Trading controls not responding

**Solution:**
1. Verify connection to server (Dashboard shows "Connected")
2. Check trading status in Dashboard
3. View Logs screen for error messages
4. Restart both app and server
5. Check server terminal for errors

### Issue: Build fails with EAS

**Solution:**
1. Make sure you're logged in: `eas login`
2. Check `app.json` is properly formatted
3. Ensure all dependencies are installed: `npm install`
4. Try building again with `--clear-cache`:
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```

### Issue: Cannot install APK (blocked by Play Protect)

**Solution:**
1. When Play Protect warning appears, tap "More details"
2. Tap "Install anyway"
3. The app is safe - Play Protect blocks apps not from Play Store
4. Alternatively, temporarily disable Play Protect:
   - Open Play Store > Menu > Play Protect > Settings
   - Turn off "Scan apps with Play Protect"
   - Install APK, then re-enable Play Protect

---

## Network Requirements

### Server Side

- **Port 3000** must be open and accessible
- **Firewall**: Allow incoming connections on port 3000
- **Router**: Port forwarding not needed if phone is on same network

**Linux Firewall:**
```bash
sudo ufw allow 3000/tcp
```

**Check if port is listening:**
```bash
netstat -an | grep 3000
```

### Phone Side

- **WiFi**: Connect to same network as server
- **Mobile Data**: Won't work unless server has public IP (not recommended for security)

---

## Performance Tips

### Optimize Battery Usage

The app auto-refreshes data every 5 seconds. To conserve battery:

1. **Logs Screen**: Turn off auto-refresh when not needed
2. **Background**: Android may limit background refresh (expected behavior)
3. **Dashboard**: Auto-refresh pauses when app is in background

### Data Usage

- Typical usage: ~1-2 MB per hour
- Most data-intensive: Logs screen with auto-refresh
- Minimal data: Dashboard and Trading screens

---

## Security Best Practices

1. **Don't share your API key** - It provides full access to your bot
2. **Use HTTPS** in production (setup SSL certificate on server)
3. **Change API key regularly** (regenerate every few months)
4. **Secure your phone** with screen lock PIN/biometric
5. **Don't install APK from untrusted sources** (only use your own build)
6. **Keep server on private network** (not exposed to internet)

---

## Updating the App

### To update to a new version:

1. Build new APK with updated version number in `app.json`:
   ```json
   "version": "2.1.0",
   "versionCode": 2
   ```

2. Build new APK:
   ```bash
   eas build --platform android --profile production
   ```

3. Download new APK

4. Install over existing app (settings and data are preserved)

---

## Alternative: Build Locally

If you prefer building APK locally without Expo's servers:

### Prerequisites

- **Android Studio** with Android SDK
- **Java JDK 11** or higher

### Steps

1. **Prebuild project:**
   ```bash
   npx expo prebuild --platform android
   ```

2. **Build with Gradle:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **APK location:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

**Note:** This is more complex and requires Android development setup.

---

## Support & Resources

### Official Documentation

- **Expo Docs**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **EAS Build**: https://docs.expo.dev/build/introduction/

### Getting Help

1. Check server logs: `tail -f logs/supervisor.log`
2. Check app logs in Dashboard or Logs screen
3. Review security logs on server: `logs/security.log`
4. Test API endpoints manually with curl/Postman

### Example curl Tests

Test health endpoint:
```bash
curl http://192.168.1.100:3000/health
```

Test with API key:
```bash
curl -H "X-API-Key: your-key" http://192.168.1.100:3000/api/status
```

---

## Appendix: EAS Build Configuration

Create `eas.json` in project root with this configuration:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

This creates three build profiles:
- **development**: For active development with dev tools
- **preview**: For testing (what we use)
- **production**: For final release

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build APK (preview)
eas build --platform android --profile preview

# Build APK (production)
eas build --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view

# Cancel running build
eas build:cancel
```

---

**Last Updated:** January 24, 2025
**App Version:** 2.0.0
**Tested on:** Android 10, 11, 12, 13, 14

---

Happy Trading! 📈
