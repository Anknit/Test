# Project Structure

## Directory Tree

```
/Users/ankit/projects/test/
│
├── Core Trading Files
│   ├── kite.js                      # Main trading bot with signal generation & execution
│   ├── api-server.js                # REST API server (Express.js) - NEW ✨
│   └── supervisor.js                # Process supervisor for crash recovery
│
├── Docker Files
│   ├── Dockerfile                   # Docker image definition - NEW ✨
│   ├── docker-compose.yml           # Docker Compose configuration - NEW ✨
│   └── .dockerignore               # Docker build exclusions - NEW ✨
│
├── Scripts
│   ├── start-api.sh                # API server startup script - NEW ✨
│   ├── daily-trading.sh            # Interactive daily trading routine - NEW ✨
│   ├── test-api.sh                 # API endpoint testing suite - NEW ✨
│   ├── update-enctoken.sh          # Safe enctoken update script
│   └── test-supervisor.sh          # Supervisor testing script
│
├── Configuration
│   ├── package.json                # Node.js dependencies & scripts - UPDATED ✨
│   ├── .env.enctoken               # Zerodha enctoken (create manually)
│   └── .gitignore                  # Git ignore rules
│
├── Documentation
│   ├── README.md                   # Project overview & quick start - NEW ✨
│   ├── API_DOCUMENTATION.md        # Complete API reference - NEW ✨
│   ├── DOCKER_DEPLOYMENT.md        # Docker deployment guide - NEW ✨
│   ├── QUICK_START.md              # 5-minute quick reference - NEW ✨
│   ├── DEPLOYMENT_SUMMARY.md       # Complete deployment summary - NEW ✨
│   ├── PROJECT_STRUCTURE.md        # This file - NEW ✨
│   └── LIVE_TRADING_GUIDE.md       # Original trading guide
│
├── Persistent Data Directories
│   ├── logs/                       # Application logs
│   │   └── supervisor.log          # Main log file
│   ├── cache/                      # Cached market data
│   │   └── cache_*.json           # Historical data cache files
│   └── enctoken_backups/           # Automatic enctoken backups
│       └── enctoken_*.bak         # Timestamped backups
│
└── Service Files
    └── kite-trading.service        # Systemd service file

✨ = New files added in this update
```

---

## File Categories

### 🤖 Core Application (3 files)

| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| `kite.js` | Trading logic, signal generation, order execution | ~1100 | Signal generation, backtesting, live trading |
| `api-server.js` | REST API server for remote control | ~450 | 15 API endpoints, process management |
| `supervisor.js` | Process monitoring and auto-restart | ~200 | Health checks, crash recovery |

### 🐳 Docker Infrastructure (3 files)

| File | Purpose | Size |
|------|---------|------|
| `Dockerfile` | Node.js 20 with Puppeteer dependencies | ~2KB |
| `docker-compose.yml` | Service definition with volumes & health checks | ~1KB |
| `.dockerignore` | Optimized build context | ~500B |

### 📜 Scripts (5 files)

| Script | Purpose | Usage |
|--------|---------|-------|
| `start-api.sh` | Start API server with validation | `./start-api.sh` |
| `daily-trading.sh` | Interactive daily routine automation | `./daily-trading.sh` |
| `test-api.sh` | Test all API endpoints | `./test-api.sh` |
| `update-enctoken.sh` | Safe enctoken update with backup | `./update-enctoken.sh TOKEN` |
| `test-supervisor.sh` | Test supervisor functionality | `./test-supervisor.sh` |

### 📚 Documentation (7 files)

| Document | Purpose | Pages |
|----------|---------|-------|
| `README.md` | Project overview, features, quick start | ~4 |
| `API_DOCUMENTATION.md` | Complete API reference with examples | ~15 |
| `DOCKER_DEPLOYMENT.md` | Docker setup & troubleshooting | ~12 |
| `QUICK_START.md` | 5-minute quick reference card | ~5 |
| `DEPLOYMENT_SUMMARY.md` | Complete deployment overview | ~10 |
| `LIVE_TRADING_GUIDE.md` | Trading guide (enctoken, orders, etc.) | ~8 |
| `PROJECT_STRUCTURE.md` | This file - project navigation | ~3 |

### ⚙️ Configuration (3 files)

| File | Purpose | Notes |
|------|---------|-------|
| `package.json` | Dependencies & NPM scripts | Includes Express.js |
| `.env.enctoken` | Zerodha Kite API token | **Must create manually** |
| `.gitignore` | Git exclusions | Includes cache, logs, .env |

---

## Quick Navigation

### Want to...

**Start the API server?**
→ [start-api.sh](start-api.sh) or [README.md](README.md)

**Learn about API endpoints?**
→ [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**Deploy with Docker?**
→ [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

**Quick 5-min reference?**
→ [QUICK_START.md](QUICK_START.md)

**Understand the complete setup?**
→ [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)

**Modify trading logic?**
→ [kite.js](kite.js) - See signal generation (lines 377-413)

**Add new API endpoints?**
→ [api-server.js](api-server.js) - Add routes after line 400

**Change Docker config?**
→ [docker-compose.yml](docker-compose.yml)

---

## Entry Points

### 1. Local Development
```bash
./start-api.sh
```
→ Starts [api-server.js](api-server.js) on port 3000

### 2. Docker Deployment
```bash
docker-compose up -d
```
→ Uses [Dockerfile](Dockerfile) + [docker-compose.yml](docker-compose.yml)

### 3. Direct Trading (Not Recommended)
```bash
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT
```
→ Runs [kite.js](kite.js) directly without API

### 4. With Supervisor
```bash
node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT
```
→ Runs [supervisor.js](supervisor.js) which manages [kite.js](kite.js)

---

## API Flow

```
User/Script
    ↓
curl http://localhost:3000/api/trading/start
    ↓
api-server.js (Express)
    ↓
spawn('node', ['kite.js', ...args])
    ↓
kite.js
    ↓
Zerodha Kite API
```

---

## Data Flow

### Historical Data
```
Zerodha API
    ↓
fetchHistorical() in kite.js
    ↓
cache/*.json (persistent)
    ↓
loadCacheData() for reuse
```

### Logs
```
kite.js / api-server.js
    ↓
console.log / fs.appendFileSync
    ↓
logs/supervisor.log
    ↓
API endpoint: GET /api/logs
```

### Enctoken
```
User gets from Kite website
    ↓
POST /api/enctoken/update
    ↓
Backup to enctoken_backups/
    ↓
Write to .env.enctoken
    ↓
Read by kite.js on startup
```

---

## Development Workflow

### 1. Make Changes
```bash
# Edit files
vim kite.js            # Modify trading logic
vim api-server.js      # Add API endpoints
```

### 2. Test Locally
```bash
# Start API
./start-api.sh

# Test endpoints
./test-api.sh

# Check logs
curl http://localhost:3000/api/logs?lines=50
```

### 3. Build Docker
```bash
# Build image
docker-compose build

# Start container
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Deploy
```bash
# Pull latest code on server
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

---

## Key Configuration Locations

### Trading Strategy Parameters
**File:** [kite.js](kite.js)
**Lines:** 1091-1103
```javascript
sl_ticks: 30              // Stop loss: 300 points
target_ticks: 70          // Target: 700 points
risk_per_trade_pct: 0.014 // Risk 1.4% per trade
```

### API Server Port
**File:** [api-server.js](api-server.js)
**Line:** 16
```javascript
const PORT = process.env.PORT || 3000;
```

### Docker Container Config
**File:** [docker-compose.yml](docker-compose.yml)
```yaml
ports:
  - "3000:3000"
environment:
  - TZ=Asia/Kolkata
```

### NPM Scripts
**File:** [package.json](package.json)
```json
"scripts": {
  "start": "node api-server.js",
  "docker:run": "docker-compose up -d"
}
```

---

## Dependencies

### Production Dependencies
- `axios` - HTTP client for Kite API
- `csv-parse` - CSV parsing (if needed)
- `dayjs` - Date/time manipulation
- `express` - Web framework for API
- `minimist` - CLI argument parsing
- `puppeteer` - Browser automation (enctoken fetch)

### System Dependencies (Docker)
- Node.js 20
- Chrome/Chromium for Puppeteer
- Various system libraries for Puppeteer

---

## Port Mapping

| Port | Service | Purpose |
|------|---------|---------|
| 3000 | Express API | REST API endpoints |

To change port:
```bash
# Local
PORT=3001 node api-server.js

# Docker
# Edit docker-compose.yml ports: "3001:3000"
```

---

## Volume Mounts (Docker)

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `./logs` | `/app/logs` | Persist logs |
| `./cache` | `/app/cache` | Persist market data cache |
| `./enctoken_backups` | `/app/enctoken_backups` | Persist enctoken backups |
| `./.env.enctoken` | `/app/.env.enctoken` | Mount enctoken (read-only) |

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3000 | API server port |
| `NODE_ENV` | production | Environment mode |
| `TZ` | Asia/Kolkata | Timezone |
| `ENCTOKEN` | (from file) | Zerodha API token |

---

## Log Locations

| Log Type | Location | Access Via |
|----------|----------|------------|
| Supervisor logs | `logs/supervisor.log` | `GET /api/logs` |
| Docker logs | Docker daemon | `docker logs kite-trading-api` |
| Enctoken backups | `enctoken_backups/` | File system |

---

## Health Checks

| Type | Interval | Command |
|------|----------|---------|
| Docker | 30s | `curl http://localhost:3000/health` |
| API | On-demand | `GET /health` |
| Process | 30s | Built into api-server.js |

---

## Next Steps

1. ✅ Review this structure
2. ✅ Read [README.md](README.md) for overview
3. ✅ Follow [QUICK_START.md](QUICK_START.md) to get started
4. ✅ Refer to [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details
5. ✅ Use [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for Docker setup

---

**Happy Trading! 🚀**
