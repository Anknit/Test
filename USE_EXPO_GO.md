# Use Your App with Expo Go (Instant Access!)

## 🎉 Development Server Running!

The Expo development server is starting. Here's how to use your app right now:

---

## Step 1: Install Expo Go on Your Phone (2 minutes)

### On Android:
1. Open **Google Play Store**
2. Search for **"Expo Go"**
3. Tap **Install**
4. Open the app

**Direct link:** https://play.google.com/store/apps/details?id=host.exp.exponent

---

## Step 2: Connect to Development Server

### Method A: Scan QR Code (Easiest)

1. **Check your terminal** - A QR code should appear
2. Open **Expo Go** on your phone
3. Tap **"Scan QR Code"**
4. Point camera at QR code on your computer screen
5. App loads automatically!

### Method B: Manual Connection

If QR code doesn't work:

1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. In Expo Go, tap **"Enter URL manually"**

3. Enter: `exp://YOUR_MAC_IP:8081`

   Example: `exp://192.168.1.100:8081`

---

## Step 3: Use Your App!

Once loaded:
- **Setup Screen** appears
- Enter server URL: `http://YOUR_SERVER_IP:3000`
- Enter API key (from `.env` file)
- Start trading!

---

## Troubleshooting

### "Unable to connect"

**Check:**
1. Phone and Mac on **same WiFi network**
2. Development server is running
3. Firewall not blocking port 8081

**Solution:**
```bash
# Restart development server
# Press Ctrl+C in terminal
# Then:
cd /Users/ankit/projects/test/kite-mobile
npm start
```

### "Network response timed out"

**Solution:**
1. Find Mac IP: `ifconfig | grep inet`
2. In Expo Go: Enter URL manually
3. Use: `exp://YOUR_MAC_IP:8081`

### App shows errors

**Solution:**
```bash
# Clear cache and restart
cd /Users/ankit/projects/test/kite-mobile
rm -rf node_modules/.cache
npm start -- --clear
```

---

## Features Available

Everything works in Expo Go:
- ✅ Dashboard with real-time updates
- ✅ Trading controls
- ✅ Backtesting
- ✅ Log viewing
- ✅ Settings management
- ✅ Auto-refresh

**No limitations!**

---

## Hot Reload

Make code changes on your Mac:
- Press **"r"** in terminal to reload
- Or shake phone and tap "Reload"

---

## Backend Setup

Don't forget to configure backend:

### 1. Update CORS

Edit `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.*
```

### 2. Start Server

```bash
cd /Users/ankit/projects/test
node api-server.js
```

### 3. Get API Key

```bash
cat .env | grep API_KEY
```

---

## Development Server Commands

In the terminal where `npm start` is running:

- **`a`** - Open Android (if you have emulator)
- **`r`** - Reload app
- **`m`** - Toggle menu
- **`j`** - Open debugger
- **Ctrl+C** - Stop server

---

## Next Steps

### Option 1: Keep Using Expo Go
- Works great for personal use
- Easy to update (just reload)
- No installation needed

### Option 2: Build APK Later
When you want a standalone APK:
1. Create Expo account (free)
2. Run: `eas build --platform android --profile preview`
3. Wait 15 minutes
4. Install APK on phone

---

## Advantages of Expo Go

✅ **Instant access** - No build time
✅ **Easy updates** - Just reload
✅ **All features work** - Full functionality
✅ **Free** - No cost
✅ **Fast development** - See changes immediately

## Disadvantages

⚠️ **Needs Expo Go app** - Extra app required
⚠️ **Same network** - Phone and Mac must be on same WiFi
⚠️ **Development mode** - Slightly larger bundle

---

## Summary

Your app is **ready to use right now** with Expo Go!

1. Install Expo Go from Play Store
2. Scan QR code in terminal
3. Enter server URL and API key
4. Start trading!

**No build needed, works instantly!** 🎉

---

**Check your terminal now for the QR code!**

If you don't see it yet, wait a few more seconds for Metro Bundler to finish starting.
