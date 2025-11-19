# Quick Start Guide - Kite Trading Bot API

## 🚀 5-Minute Setup

### Option 1: Local (Development)

```bash
# 1. Install dependencies
npm install

# 2. Create enctoken file
echo 'ENCTOKEN="your_enctoken_here"' > .env.enctoken
chmod 600 .env.enctoken

# 3. Start API server
./start-api.sh

# 4. API is live at http://localhost:3000
```

### Option 2: Docker (Production)

```bash
# 1. Create enctoken file
echo 'ENCTOKEN="your_enctoken_here"' > .env.enctoken
chmod 600 .env.enctoken

# 2. Install dependencies (for Docker build)
npm install

# 3. Start with Docker Compose
docker-compose up -d

# 4. API is live at http://localhost:3000
```

---

## 📋 Essential API Commands

### 1. Update Enctoken (Do this DAILY)

#### Option A: Automatic Login (EASIEST! ⭐)

```bash
# Just provide credentials and 2FA code - enctoken is fetched automatically!
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "AB1234",
    "password": "your_password",
    "totp": "123456"
  }'
```

#### Option B: Manual Update

```bash
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "YOUR_NEW_ENCTOKEN"}'
```

### 2. Start Trading

```bash
# Paper trading (test mode)
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "paper": true,
    "notimeexit": true
  }'

# Live trading (real money)
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'
```

### 3. Check Status

```bash
curl http://localhost:3000/api/status | jq
```

### 4. View Logs

```bash
curl http://localhost:3000/api/logs?lines=50 | jq -r '.data.logs[]'
```

### 5. Stop Trading

```bash
curl -X POST http://localhost:3000/api/trading/stop
```

---

## 🔑 Getting Enctoken

1. Login to [kite.zerodha.com](https://kite.zerodha.com)
2. Open DevTools (Press F12)
3. Go to **Application** tab → **Cookies** → https://kite.zerodha.com
4. Copy the `enctoken` value
5. Update via API or file

**⚠️ Enctoken expires DAILY at 3:30 AM IST**

---

## 📊 Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/status` | GET | Get trading status |
| `/api/trading/start` | POST | Start trading |
| `/api/trading/stop` | POST | Stop trading |
| `/api/trading/restart` | POST | Restart trading |
| `/api/enctoken/login` | POST | **Auto-login & fetch enctoken ⭐** |
| `/api/enctoken/update` | POST | Update enctoken manually |
| `/api/enctoken/status` | GET | Check enctoken |
| `/api/logs` | GET | Fetch logs |
| `/api/backtest/run` | POST | Run backtest |
| `/api/cache` | GET | List cache |
| `/api/cache/clear` | POST | Clear cache |

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.

---

## 🐳 Docker Commands

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild
docker-compose build
docker-compose up -d

# Check status
docker ps
docker inspect --format='{{.State.Health.Status}}' kite-trading-api
```

---

## 🔍 Monitoring

### Watch Status

```bash
watch -n 5 'curl -s http://localhost:3000/api/status | jq'
```

### Watch Logs

```bash
watch -n 10 'curl -s "http://localhost:3000/api/logs?lines=20" | jq -r ".data.logs[]"'
```

### Docker Logs

```bash
docker logs -f kite-trading-api
```

---

## 📈 Strategy Performance

**Backtest Results (30 days on SILVER futures):**

```
✓ Trades: 130
✓ Win Rate: 38.46%
✓ Total P&L: ₹192,936.85 (43% return)
✓ Profit Factor: 2.09 (Excellent)
✓ Avg Win: ₹16,394.61
✓ Avg Loss: ₹-7,834.92
✓ R:R Ratio: 2.33:1
```

---

## ⚙️ Configuration

### Trading Parameters

```json
{
  "instrument": "120395527",           // SILVER futures token
  "tradingsymbol": "SILVERM25FEBFUT",  // Trading symbol
  "paper": false,                       // Paper trading mode
  "notimeexit": true                    // Disable time-based exit
}
```

### Default Strategy Settings

- **Stop Loss**: 30 ticks (300 points)
- **Target**: 70 ticks (700 points)
- **Risk per Trade**: 1.4% of capital
- **Max Capital**: ₹450,000
- **Indicators**: EMA(12/26), MACD(12/26/9), RSI(14)

---

## 🆘 Troubleshooting

### API not responding

```bash
# Check if server is running
curl http://localhost:3000/health

# Check process
ps aux | grep node

# Restart
pkill -f api-server
./start-api.sh
```

### Trading won't start

```bash
# 1. Check enctoken
curl http://localhost:3000/api/enctoken/status

# 2. Update enctoken
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "NEW_TOKEN"}'

# 3. Check logs
curl "http://localhost:3000/api/logs?filter=ERROR"
```

### Docker issues

```bash
# View logs
docker logs kite-trading-api

# Restart container
docker-compose restart

# Rebuild
docker-compose down
docker-compose build
docker-compose up -d

# Check enctoken file
docker exec kite-trading-api cat .env.enctoken
```

---

## 📝 Daily Routine

```bash
#!/bin/bash
# Save as: daily-trading.sh

# 1. Get fresh enctoken from Kite
NEW_ENCTOKEN="paste_your_new_enctoken_here"

# 2. Update enctoken
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d "{\"enctoken\": \"$NEW_ENCTOKEN\"}"

# 3. Start trading
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'

echo "✓ Trading started. Monitor at http://localhost:3000/api/logs"
```

```bash
chmod +x daily-trading.sh
./daily-trading.sh
```

---

## 🧪 Testing

```bash
# Test API endpoints
./test-api.sh

# Run backtest
curl -X POST http://localhost:3000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'
```

---

## 📚 Documentation

- [README.md](README.md) - Overview and features
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Docker setup guide
- [LIVE_TRADING_GUIDE.md](LIVE_TRADING_GUIDE.md) - Trading guide

---

## ⚠️ Important Notes

1. **Enctoken expires DAILY** at 3:30 AM IST - update before market open
2. **Always test in paper mode** before live trading
3. **Monitor actively** during market hours
4. **Backup enctoken** backups directory regularly
5. **Secure your API** - add authentication for production
6. **Use HTTPS** in production with reverse proxy
7. **Start small** - test with minimal capital first

---

## 🔐 Security Checklist

- [ ] `.env.enctoken` not committed to git
- [ ] File permissions set to 600 on `.env.enctoken`
- [ ] API access restricted to localhost/trusted IPs
- [ ] HTTPS enabled for production
- [ ] Authentication added to API endpoints
- [ ] Firewall rules configured
- [ ] Logs monitored regularly

---

## 🎯 Next Steps

1. ✅ Start API server
2. ✅ Update enctoken
3. ✅ Test in paper mode
4. ✅ Monitor for one day
5. ✅ Review logs and performance
6. ✅ If satisfied, switch to live trading
7. ✅ Monitor actively

---

**Need Help?** Check the full documentation in the files listed above.

**⚠️ Trading Disclaimer:** This bot is for educational purposes. Trading involves substantial risk. Use at your own risk. Always test thoroughly and start small.
