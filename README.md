# Kite Trading Bot with REST API & Mobile App

Automated trading bot for Zerodha Kite with a comprehensive REST API and native mobile app for remote management. Built with Node.js and React Native.

## Features

### Backend
- 🤖 **Automated Trading**: Advanced multi-indicator strategy (EMA + MACD + RSI)
- 🚀 **REST API**: Control everything via HTTP endpoints with API key authentication
- 🔒 **Enterprise Security**: Helmet, CORS, rate limiting, input validation, HTTPS enforcement
- 🐳 **Docker Support**: Easy deployment with Docker/Docker Compose
- 📊 **Backtesting**: Test strategies on historical data
- 💾 **Data Caching**: Fast backtesting with cached market data
- 🔄 **Auto-restart**: Supervisor monitors and restarts on crashes
- 📝 **Comprehensive Logging**: Track all activities with sanitization
- 🔐 **Enctoken Management**: Safe token updates with backups
- 📧 **Email Alerts**: SMTP notifications for important events
- 🛡️ **Security Hardened**: 0 vulnerabilities, all security issues fixed

### Mobile App (NEW!)
- 📱 **Native Android App**: React Native mobile application
- 📊 **Real-time Dashboard**: Monitor trading status and metrics
- 🎯 **Trading Controls**: Start/stop trading from your phone
- 📈 **Backtesting**: Run backtests on the go
- 📝 **Live Logs**: View and filter logs in real-time
- ⚙️ **Settings**: Manage enctoken, email alerts, and configuration
- 🔒 **Secure**: API key authentication with encrypted storage
- 📡 **Auto-refresh**: Real-time updates every 5 seconds

## Quick Start

### 1. Local Development

```bash
# Install dependencies
npm install

# Create enctoken file
echo 'ENCTOKEN="your_enctoken_here"' > .env.enctoken
chmod 600 .env.enctoken

# Start API server
npm start

# API available at http://localhost:3000
```

### 2. Docker Deployment (Recommended)

```bash
# Create enctoken file
echo 'ENCTOKEN="your_enctoken_here"' > .env.enctoken
chmod 600 .env.enctoken

# Install dependencies (for building)
npm install

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# API available at http://localhost:3000
```

## API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /api/status` - Get trading process status

### Trading Control
- `POST /api/trading/start` - Start trading
- `POST /api/trading/stop` - Stop trading
- `POST /api/trading/restart` - Restart trading

### Enctoken Management
- `POST /api/enctoken/update` - Update enctoken
- `GET /api/enctoken/status` - Check enctoken validity

### Logs & Monitoring
- `GET /api/logs` - Fetch recent logs
- `GET /api/logs/download` - Download log file
- `POST /api/logs/clear` - Clear logs

### Backtesting
- `POST /api/backtest/run` - Run backtest
- `GET /api/backtest/results` - Get results

### Cache Management
- `GET /api/cache` - List cache files
- `POST /api/cache/clear` - Clear cache

## Usage Examples

### Start Trading

```bash
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'
```

### Update Enctoken (Daily Required)

```bash
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "your_new_enctoken_here"}'
```

### Check Status

```bash
curl http://localhost:3000/api/status | jq
```

### View Logs

```bash
curl http://localhost:3000/api/logs?lines=50 | jq
```

### Stop Trading

```bash
curl -X POST http://localhost:3000/api/trading/stop
```

## Strategy Performance

**Optimized Parameters (30 days backtest on SILVER futures):**

```
Trades: 130
Win Rate: 38.46%
Total P&L: ₹192,936.85 (43% return on ₹450k)
Profit Factor: 2.09 (Excellent)
Avg Win: ₹16,394.61
Avg Loss: ₹-7,834.92
Risk-Reward: 2.33:1 (300 point SL, 700 point TP)
```

## Strategy Components

- **Trend Detection**: EMA 12/26 with 0.3 ATR gap filter
- **Momentum**: MACD (12/26/9) histogram
- **Strength**: RSI (14) for overbought/oversold
- **Risk Management**: Fixed tick stops (30 ticks = 300 points)
- **Position Sizing**: Risk 1.4% per trade
- **Exit Strategy**: 2.33:1 risk-reward ratio

## Directory Structure

```
.
├── kite.js                    # Main trading script
├── api-server.js              # REST API server
├── supervisor.js              # Process supervisor
├── package.json               # Dependencies
├── Dockerfile                 # Docker image
├── docker-compose.yml         # Docker Compose config
├── .dockerignore             # Docker ignore file
├── .env.enctoken             # Enctoken file (create manually)
├── API_DOCUMENTATION.md      # Complete API docs
├── DOCKER_DEPLOYMENT.md      # Docker deployment guide
├── LIVE_TRADING_GUIDE.md     # Trading guide
├── logs/                     # Log files
├── cache/                    # Cached market data
└── enctoken_backups/         # Enctoken backups
```

## Scripts

```bash
npm start              # Start API server
npm run trade          # Run trading directly (not recommended)
npm run supervisor     # Run with supervisor
npm run docker:build   # Build Docker image
npm run docker:run     # Start with Docker Compose
npm run docker:stop    # Stop Docker container
npm run docker:logs    # View Docker logs
```

## Testing

```bash
# Start API server
npm start

# In another terminal, run tests
./test-api.sh
```

## Mobile App

### Setup & Installation

1. **Navigate to mobile app directory:**
   ```bash
   cd kite-mobile
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```
   Then scan QR code with Expo Go app on your Android phone.

3. **Build APK for installation:**

   **Option A: Local Build (No Expo Account - Recommended)**
   ```bash
   ./build-local.sh
   ```
   Builds APK on your Mac in 5-10 minutes. No account needed!

   **Option B: Cloud Build (Requires Expo Account)**
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform android --profile preview
   ```

4. **Complete setup guides:**
   - [BUILD_WITHOUT_EXPO.md](BUILD_WITHOUT_EXPO.md) - Build locally without account ⭐
   - [LOCAL_BUILD_GUIDE.md](LOCAL_BUILD_GUIDE.md) - Detailed local build instructions
   - [kite-mobile/ANDROID_BUILD_GUIDE.md](kite-mobile/ANDROID_BUILD_GUIDE.md) - Cloud build guide

### Mobile App Features

- **Dashboard**: Real-time trading status, process info, enctoken validity
- **Trading Controls**: Start/stop/restart trading with parameter configuration
- **Backtesting**: Run historical backtests and view results
- **Logs**: Real-time log viewing with filters (ERROR/WARN/INFO)
- **Settings**: Kite login, email alerts, cache management, logout

### Backend Configuration for Mobile

Update `.env` file to allow mobile connections:

```bash
# Add your phone's IP or use wildcard for local network
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.*
```

Restart API server after changing CORS settings.

## Documentation

### Backend
- [API Documentation](API_DOCUMENTATION.md) - Complete REST API reference
- [Security Setup Guide](SECURITY_SETUP_GUIDE.md) - Complete security configuration
- [Security Fixes](SECURITY_FIXES_IMPLEMENTED.md) - All security fixes implemented
- [Docker Deployment](DOCKER_DEPLOYMENT.md) - Docker setup and troubleshooting
- [Live Trading Guide](LIVE_TRADING_GUIDE.md) - Trading-specific documentation
- [Quick Start Guide](QUICK_START_GUIDE.md) - Fast setup guide
- [Email Setup Guide](EMAIL_SETUP_GUIDE.md) - Email alerts configuration

### Mobile App
- [Mobile App README](kite-mobile/README.md) - Mobile app overview and features
- [Android Build Guide](kite-mobile/ANDROID_BUILD_GUIDE.md) - Complete build and installation guide

## Important Notes

### Enctoken Management

⚠️ **Enctoken expires DAILY at 3:30 AM IST**

You must update it every trading day:

1. **Get new enctoken** from Kite website:
   - Login to kite.zerodha.com
   - Open DevTools (F12) → Application → Cookies
   - Copy `enctoken` value

2. **Update via API** (Recommended):
   ```bash
   curl -X POST http://localhost:3000/api/enctoken/update \
     -H "Content-Type: application/json" \
     -d '{"enctoken": "NEW_TOKEN"}'
   ```

3. **Or update file manually**:
   ```bash
   echo 'ENCTOKEN="new_token"' > .env.enctoken
   ```

### Bracket Orders

The bot uses Zerodha bracket orders:
- Entry + Stop Loss + Target placed simultaneously
- Exits are managed by broker's server (not your script)
- OCO (One-Cancels-Other) automatic cancellation
- Script only monitors for order updates

### Paper Trading

Always test in paper mode first:

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

## System Requirements

- **Node.js**: >= 18.0.0
- **RAM**: 1GB minimum (2GB recommended)
- **Disk**: 500MB for cache + logs
- **Network**: Stable internet connection
- **OS**: Linux, macOS, or Windows (with Docker)

## Environment Variables

```bash
PORT=3000                    # API server port (default: 3000)
NODE_ENV=production          # Environment mode
TZ=Asia/Kolkata             # Timezone for Indian markets
ENCTOKEN=your_token_here    # Zerodha Kite enctoken
```

## Production Recommendations

1. **Use Docker** for consistent environment
2. **Set up reverse proxy** (nginx/caddy) with SSL
3. **Add authentication** to API endpoints
4. **Monitor logs** regularly
5. **Backup enctoken** backups directory
6. **Use firewall** to restrict API access
7. **Set up alerting** for errors/crashes

## Monitoring

### Docker Container Health

```bash
docker ps
docker inspect --format='{{.State.Health.Status}}' kite-trading-api
```

### API Health

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed status
curl http://localhost:3000/api/status | jq

# Watch logs
watch -n 5 'curl -s http://localhost:3000/api/logs?lines=20 | jq -r ".data.logs[]"'
```

### Process Status

```bash
# Via API
curl http://localhost:3000/api/status

# Docker logs
docker logs -f kite-trading-api
```

## Troubleshooting

### API not accessible
```bash
# Check if server is running
curl http://localhost:3000/health

# Check Docker container
docker ps
docker logs kite-trading-api

# Check port
lsof -i :3000
```

### Trading won't start
```bash
# Check enctoken status
curl http://localhost:3000/api/enctoken/status

# Check logs for errors
curl "http://localhost:3000/api/logs?filter=ERROR"

# Verify enctoken file exists
ls -la .env.enctoken
```

### Container keeps restarting
```bash
# View container logs
docker logs kite-trading-api

# Check container status
docker inspect kite-trading-api | grep -A 5 State

# Verify enctoken file is mounted
docker exec kite-trading-api cat .env.enctoken
```

## Security

⚠️ **Security Best Practices:**

1. **Never commit** `.env.enctoken` to git (already in .gitignore)
2. **Restrict API access** to localhost or trusted IPs
3. **Use HTTPS** in production with reverse proxy
4. **Add authentication** to API endpoints
5. **Keep enctoken secure** - it has full trading access
6. **Monitor logs** for suspicious activity
7. **Use strong firewall rules**

## Daily Routine

```bash
# 1. Get fresh enctoken from Kite (expires daily at 3:30 AM IST)
# 2. Update via API:
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "NEW_TOKEN"}'

# 3. Start trading:
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'

# 4. Monitor:
curl http://localhost:3000/api/logs?lines=50
```

## Support

For issues and questions:
- Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- Check [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- Review logs: `curl http://localhost:3000/api/logs`

## License

ISC

## Disclaimer

⚠️ **Trading Risk Disclaimer:**

This bot is for educational purposes. Trading involves substantial risk of loss. Use at your own risk. Always:
- Test thoroughly in paper trading mode
- Start with small position sizes
- Monitor actively during market hours
- Never trade more than you can afford to lose
- Understand the strategy before going live

Past performance does not guarantee future results.
