# Kite Trading Bot - Mobile App

React Native mobile application for controlling and monitoring your Kite algorithmic trading bot.

## Features

- 📊 **Real-time Dashboard** - Monitor trading status, P&L, and system metrics
- 🎯 **Trading Controls** - Start/stop trading with customizable parameters
- 📈 **Backtesting** - Test strategies on historical data
- 📝 **Live Logs** - View and filter real-time application logs
- ⚙️ **Settings & Config** - Manage enctoken, email alerts, and app settings
- 🔒 **Secure** - API key authentication with encrypted local storage
- 📱 **Offline Support** - Graceful handling of connection issues

## Screenshots

### Dashboard
View trading status, process info, and system metrics at a glance.

### Trading Controls
Configure and start/stop trading with complete parameter control.

### Settings
Login to Kite, configure email alerts, and manage app settings.

## Prerequisites

- **Node.js** 18+ and npm
- **Android phone** with Android 5.0+
- **Trading bot server** running (see main project README)

## Quick Start

### 1. Install Dependencies

```bash
cd kite-mobile
npm install
```

### 2. Start Development Server

```bash
npm start
```

Then:
- Install **Expo Go** on your Android phone
- Scan the QR code with Expo Go
- App will load on your phone

### 3. Build APK for Installation

For standalone APK (doesn't require Expo Go):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

See [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md) for detailed instructions.

## Project Structure

```
kite-mobile/
├── App.js                   # Main app entry point
├── app.json                 # Expo configuration
├── eas.json                 # EAS Build configuration
├── services/
│   └── api.js              # API client for backend communication
├── screens/
│   ├── SetupScreen.js      # First-time setup
│   ├── DashboardScreen.js  # Main dashboard
│   ├── TradingScreen.js    # Trading controls
│   ├── BacktestScreen.js   # Backtesting interface
│   ├── SettingsScreen.js   # Settings and configuration
│   └── LogsScreen.js       # Log viewer
├── utils/
│   ├── storage.js          # Secure storage utilities
│   └── constants.js        # App constants
└── assets/                 # Images and icons
```

## Configuration

### Backend Server Setup

1. **Start your trading bot server:**
   ```bash
   node api-server.js
   ```

2. **Note your API key** from server startup logs

3. **Find your server IP address:**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr show`

### App Configuration

On first launch:

1. Enter **Server URL**: `http://YOUR_SERVER_IP:3000`
2. Enter **API Key**: (from server logs or `.env` file)
3. Tap **Test Connection**
4. If successful, proceed to main app

## API Endpoints Used

The app communicates with the following backend endpoints:

- `GET /health` - Health check
- `GET /api/status` - Trading status
- `POST /api/trading/start` - Start trading
- `POST /api/trading/stop` - Stop trading
- `POST /api/trading/restart` - Restart trading
- `POST /api/enctoken/login` - Login to Kite
- `GET /api/enctoken/validate` - Validate enctoken
- `GET /api/logs` - Fetch logs
- `POST /api/backtest/run` - Run backtest
- `POST /api/email/config` - Configure email alerts
- `POST /api/cache/clear` - Clear cache
- And more...

## Security

### API Authentication

All API requests include the API key in headers:

```javascript
headers: {
  'X-API-Key': 'your-api-key-here'
}
```

### Secure Storage

Sensitive data is stored using Expo SecureStore (encrypted):
- API Key
- Server URL
- Setup completion flag

### Network Security

- HTTPS enforced in production
- CORS configured on backend
- Rate limiting on backend API

## Development

### Running in Development Mode

```bash
npm start
```

Options:
- `a` - Open on Android emulator/device
- `w` - Open in web browser
- `r` - Reload app
- `m` - Toggle menu

### Available Scripts

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

### Dependencies

Main dependencies:
- **react-native** - Mobile framework
- **expo** - Development platform
- **react-navigation** - Navigation
- **react-native-paper** - Material Design components
- **axios** - HTTP client
- **expo-secure-store** - Encrypted storage

## Building for Production

### Build APK

```bash
# Preview build (for testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### Build Configuration

Edit `eas.json` to customize build settings:

```json
{
  "build": {
    "preview": {
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

## Installation on Android

See [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md) for complete installation instructions.

### Quick Steps

1. Download APK from EAS build
2. Enable "Install unknown apps" in Android settings
3. Open APK file and tap Install
4. Launch app and complete setup

## Troubleshooting

### Cannot connect to server

1. Verify server is running: `node api-server.js`
2. Check server IP address
3. Ensure phone and server on same network
4. Test in browser: `http://SERVER_IP:3000/health`

### API key not working

1. Check API key is correct (64 characters)
2. Verify in server `.env` file
3. Restart server after changing API key
4. Logout and setup again in app

### App crashes on launch

1. Clear app data in Android settings
2. Reinstall app
3. Check for console errors in development mode

### Logs not loading

1. Verify API authentication working
2. Check server is generating logs
3. Try manual refresh
4. View server terminal for errors

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build platform
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design components
- **Axios** - HTTP requests
- **Expo SecureStore** - Encrypted storage
- **Material Community Icons** - Icon library

## Performance

- **App size**: ~25-30 MB (APK)
- **Memory usage**: ~80-100 MB
- **Network usage**: ~1-2 MB/hour (with auto-refresh)
- **Battery impact**: Minimal (refreshes pause in background)

## Future Enhancements

- [ ] Push notifications for trade alerts
- [ ] Charts and graphs for P&L visualization
- [ ] Dark mode theme
- [ ] Fingerprint/Face ID authentication
- [ ] Position management (modify/close positions)
- [ ] Trade history with filters
- [ ] Performance analytics dashboard
- [ ] Multiple server/account support
- [ ] Offline caching for recent data
- [ ] Widget for home screen

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

For issues and questions:
1. Check [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md) troubleshooting section
2. Review server logs: `tail -f logs/supervisor.log`
3. Check app logs in Logs screen
4. Open an issue in the GitHub repository

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- UI components from [React Native Paper](https://callstack.github.io/react-native-paper/)
- Navigation by [React Navigation](https://reactnavigation.org/)

---

**Version:** 2.0.0
**Last Updated:** January 24, 2025
**Platform:** Android 5.0+
**Framework:** React Native + Expo
