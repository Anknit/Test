# APK Build & Installation Guide

Complete step-by-step instructions to build the APK and install it on your Android phone.

---

## Prerequisites

✅ EAS CLI installed (already done)
⚠️ Expo account (you need to create one)
⚠️ Android phone with Android 5.0+

---

## Step 1: Create Expo Account (If you don't have one)

1. Go to: **https://expo.dev/signup**
2. Sign up with:
   - Email and password, OR
   - GitHub account, OR
   - Google account
3. Verify your email
4. Remember your credentials for next step

---

## Step 2: Login to Expo

Run this command in your terminal:

```bash
cd /Users/ankit/projects/test/kite-mobile
eas login
```

**You'll be prompted to enter:**
- Email or username
- Password

**Expected output:**
```
✔ Logged in as your-username
```

---

## Step 3: Configure EAS (First time only)

Initialize EAS for your project:

```bash
eas build:configure
```

**What happens:**
- Creates/updates `eas.json` (already exists)
- May ask to create project ID
- Answer "Yes" to any prompts

**Expected output:**
```
✔ EAS project created
```

---

## Step 4: Build Android APK

Run the build command:

```bash
eas build --platform android --profile preview
```

**What happens:**
1. **Code upload:** Project files uploaded to Expo servers
2. **Build queue:** Build added to queue (may take 1-5 minutes to start)
3. **Building:** Android APK compiled (takes 10-20 minutes)
4. **Download link:** You'll get a URL to download APK

**Expected output:**
```
✔ Build finished
  https://expo.dev/accounts/your-account/projects/kite-trading-bot/builds/abc123

Download URL:
  https://expo.dev/artifacts/eas/abc123-android.apk
```

**Important:**
- ⏱️ Build takes **10-20 minutes**
- 🌐 Requires **internet connection** (uploads ~30MB)
- 💰 Uses **free Expo tier** (limited builds per month)
- ✅ You can close terminal - build continues on Expo servers

---

## Step 5: Monitor Build Progress

While building, you can:

**Option 1: Watch in terminal** (stays connected)
- Build progress shown in real-time
- Wait for completion

**Option 2: Check online** (can close terminal)
1. Go to: https://expo.dev
2. Login to your account
3. Click on your project
4. Go to "Builds" tab
5. See build status

**Option 3: Check via CLI**
```bash
eas build:list
```

---

## Step 6: Download APK

Once build completes, you'll get a download URL.

**Option A: Download on Computer, Transfer to Phone**

1. **On Computer:**
   - Click the download link
   - APK file downloads (~25-30 MB)
   - File name: something like `kite-trading-bot-abc123.apk`

2. **Transfer to Phone:**

   **Via USB:**
   ```bash
   # Connect phone via USB
   # Enable USB debugging on phone
   # Copy APK to phone's Download folder
   adb push kite-trading-bot-*.apk /sdcard/Download/
   ```

   **Via Cloud:**
   - Upload APK to Google Drive/Dropbox
   - Open on phone and download

**Option B: Download Directly on Phone**

1. Open the download URL in your phone's browser
2. APK downloads to Downloads folder
3. Proceed to installation

---

## Step 7: Prepare Phone for Installation

### Enable "Install Unknown Apps"

**Android 8.0 and above:**
1. Go to **Settings**
2. Tap **Apps** or **Applications**
3. Tap **Special app access** or **Advanced**
4. Tap **Install unknown apps**
5. Select **Chrome** or **Files** (whichever you'll use to open APK)
6. Toggle **"Allow from this source"** ON

**Android 7.0 and below:**
1. Go to **Settings**
2. Tap **Security**
3. Enable **"Unknown sources"**
4. Confirm the warning

**Screenshots locations vary by manufacturer:**
- Samsung: Settings > Biometrics and security > Install unknown apps
- Google Pixel: Settings > Apps > Special app access > Install unknown apps
- OnePlus: Settings > Security > Install unknown apps
- Xiaomi: Settings > Additional settings > Privacy > Install unknown apps

---

## Step 8: Install APK on Phone

### Method 1: From Downloads Folder

1. Open **Files** or **File Manager** app
2. Navigate to **Downloads** folder
3. Tap on the APK file (kite-trading-bot-*.apk)
4. Tap **"Install"**
5. If Play Protect warning appears:
   - Tap **"More details"**
   - Tap **"Install anyway"**
6. Wait for installation (~10-20 seconds)
7. Tap **"Open"** to launch

### Method 2: From Browser

1. Open **Chrome** (or browser you downloaded with)
2. Pull down notification tray
3. Tap the download notification
4. Follow steps 4-7 above

### Method 3: Using ADB (Advanced)

```bash
# Connect phone via USB with USB debugging enabled
adb devices  # Verify phone connected
adb install kite-trading-bot-*.apk
```

---

## Step 9: First Launch - App Setup

### 9.1: Find Your Server IP Address

**On your server computer:**

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig | findstr IPv4
```

**Example output:**
```
inet 192.168.1.100 netmask 0xffffff00
```

Your server IP is: **192.168.1.100**

### 9.2: Get Your API Key

**On your server:**

```bash
# Check if server is running
ps aux | grep api-server

# Start server if not running
cd /Users/ankit/projects/test
node api-server.js
```

**Copy the API key from startup logs:**
```
🔐 API KEY GENERATED
======================================================================
API Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8
```

**Or check .env file:**
```bash
cat .env | grep API_KEY
```

### 9.3: Configure App

1. **Launch the app** on your phone
2. You'll see the **Setup Screen**
3. Enter **Server URL:**
   ```
   http://192.168.1.100:3000
   ```
   ⚠️ Replace `192.168.1.100` with YOUR server IP
   ⚠️ Must include `http://` or `https://`
   ⚠️ Include port number (default: 3000)

4. Enter **API Key:**
   - Paste the 64-character key from server logs
   - Or from `.env` file

5. Tap **"Test Connection"**
   - App will try to connect to server
   - Shows success or error message

6. If successful, tap **"Continue"**
   - Credentials saved securely
   - Navigate to main app

---

## Step 10: Update Backend for Mobile Access

### Update CORS Settings

On your server, edit the `.env` file:

```bash
cd /Users/ankit/projects/test
nano .env  # or use any text editor
```

**Add or update this line:**
```bash
# Allow connections from your local network
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.*
```

**Save and restart server:**
```bash
# Stop server (Ctrl+C)
# Start server again
node api-server.js
```

---

## Step 11: Verify Installation

### Test Server Connection from Phone

1. Open **Chrome** on your phone
2. Go to: `http://YOUR_SERVER_IP:3000/health`
3. You should see:
   ```json
   {"status":"ok","timestamp":"2025-01-24T..."}
   ```

If this works, the app will work too!

### Test App Features

1. **Dashboard:**
   - Should show trading status
   - Process info displayed
   - No errors

2. **Trading Screen:**
   - Change some parameters
   - Don't start trading yet (just test UI)

3. **Logs Screen:**
   - Should display recent logs
   - Try filtering

4. **Settings:**
   - Tap "Connection Info"
   - Verify server URL and API key

---

## Troubleshooting

### Build Issues

#### "Not logged in"
```bash
eas login
```

#### "Project not configured"
```bash
eas build:configure
```

#### "Build failed"
- Check build logs: `eas build:view`
- Try with clean cache: `eas build --platform android --profile preview --clear-cache`

### Installation Issues

#### "App not installed"
**Cause:** Conflicting signature or corrupted APK
**Solution:**
1. Uninstall any existing version
2. Download APK again
3. Reinstall

#### "Install blocked by Play Protect"
**Solution:**
1. Tap "More details"
2. Tap "Install anyway"
3. App is safe - Play Protect blocks non-Play Store apps

#### "Unable to install unknown apps"
**Solution:**
1. Settings > Security > Install unknown apps
2. Enable for Chrome/Files app
3. Try installation again

### Connection Issues

#### "Connection Failed" in app setup
**Check:**
- ✅ Server is running: `ps aux | grep api-server`
- ✅ Server IP is correct: `ifconfig` or `ipconfig`
- ✅ Phone and server on same WiFi network
- ✅ Test in phone browser: `http://SERVER_IP:3000/health`
- ✅ Firewall allows port 3000

**Linux firewall:**
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

#### "Unauthorized" error
**Check:**
- ✅ API key is correct (64 characters)
- ✅ No spaces in API key
- ✅ Server has same API key in `.env`
- ✅ Server restarted after changing API key

#### "No response from server"
**Check:**
- ✅ WiFi connection on phone
- ✅ Server is running
- ✅ CORS settings updated
- ✅ Both devices on same network

---

## Alternative: Quick Test Without Building

If you want to test the app immediately without building APK:

### Option 1: Expo Go (Fastest)

1. **Install Expo Go on phone:**
   - Google Play Store: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Start development server:**
   ```bash
   cd /Users/ankit/projects/test/kite-mobile
   npm start
   ```

3. **Scan QR code:**
   - Open Expo Go on phone
   - Tap "Scan QR Code"
   - Scan from terminal
   - App loads instantly

**Pros:** Instant, no build time
**Cons:** Needs Expo Go app, same WiFi required

---

## Build Command Reference

```bash
# Build preview APK (recommended)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Build with clean cache
eas build --platform android --profile preview --clear-cache

# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]

# Cancel running build
eas build:cancel
```

---

## File Locations

### On Computer:
- **Project:** `/Users/ankit/projects/test/kite-mobile/`
- **Config:** `/Users/ankit/projects/test/kite-mobile/eas.json`
- **Downloaded APK:** `~/Downloads/kite-trading-bot-*.apk`

### On Phone:
- **APK:** `/sdcard/Download/kite-trading-bot-*.apk`
- **Installed:** `/data/app/com.kitetradingbot.app/`

---

## Security Notes

### During Installation

- ⚠️ Only install APK you built yourself
- ⚠️ Play Protect warning is normal for non-Play Store apps
- ⚠️ The app is safe - you built it

### After Installation

- 🔒 Lock your phone with PIN/fingerprint
- 🔒 Don't share your API key
- 🔒 Keep server on private network
- 🔒 Use HTTPS in production (setup SSL on server)

---

## Next Steps After Installation

1. ✅ Complete app setup (server URL + API key)
2. ⚠️ Test all features
3. ⚠️ Configure email alerts in Settings
4. ⚠️ Test paper trading first
5. ⚠️ Monitor dashboard
6. ⚠️ Check logs regularly
7. ⚠️ Start live trading when confident

---

## Support Commands

### Check Server Status
```bash
# Is server running?
ps aux | grep api-server

# View server logs
tail -f /Users/ankit/projects/test/logs/supervisor.log

# View security logs
tail -f /Users/ankit/projects/test/logs/security.log
```

### Test Server API
```bash
# Health check (no auth)
curl http://192.168.1.100:3000/health

# Status check (with auth)
curl -H "X-API-Key: YOUR_API_KEY" http://192.168.1.100:3000/api/status
```

### Phone Connection Test
```bash
# From phone's browser, visit:
http://YOUR_SERVER_IP:3000/health

# Should show:
{"status":"ok","timestamp":"..."}
```

---

## Summary Checklist

### Build Phase
- [ ] EAS CLI installed
- [ ] Logged into Expo account
- [ ] Build started
- [ ] Build completed (10-20 min)
- [ ] APK downloaded

### Installation Phase
- [ ] "Install unknown apps" enabled on phone
- [ ] APK transferred to phone
- [ ] APK installed successfully
- [ ] App launched

### Configuration Phase
- [ ] Server IP address found
- [ ] API key copied
- [ ] Server URL entered in app
- [ ] API key entered in app
- [ ] Connection test successful
- [ ] CORS settings updated on server
- [ ] Server restarted

### Verification Phase
- [ ] Dashboard loads
- [ ] Trading screen works
- [ ] Logs display
- [ ] Settings accessible
- [ ] Connection stable

---

**Ready to build?** Run this command:

```bash
cd /Users/ankit/projects/test/kite-mobile
eas login
eas build --platform android --profile preview
```

Then follow the steps above! 🚀📱

---

**Questions or Issues?**
- Check [ANDROID_BUILD_GUIDE.md](kite-mobile/ANDROID_BUILD_GUIDE.md) for detailed troubleshooting
- Review [QUICK_START.md](kite-mobile/QUICK_START.md) for quick reference
- Check server logs for backend issues
- Check app Logs screen for app issues
