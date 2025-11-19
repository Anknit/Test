# Docker Deployment Guide

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (usually included with Docker Desktop)
- Valid Zerodha Kite enctoken

---

## Quick Start

### 1. Prepare Enctoken

Create the enctoken file before starting:

```bash
echo 'ENCTOKEN="your_enctoken_here"' > .env.enctoken
chmod 600 .env.enctoken
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### 4. Access the API

The API will be available at `http://localhost:3000`

```bash
# Test the API
curl http://localhost:3000/health
```

---

## Manual Docker Build

If you prefer manual control:

```bash
# Build the image
docker build -t kite-trading-bot .

# Run the container
docker run -d \
  --name kite-trading-api \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/cache:/app/cache \
  -v $(pwd)/enctoken_backups:/app/enctoken_backups \
  -v $(pwd)/.env.enctoken:/app/.env.enctoken:ro \
  -e TZ=Asia/Kolkata \
  kite-trading-bot

# View logs
docker logs -f kite-trading-api

# Stop container
docker stop kite-trading-api

# Remove container
docker rm kite-trading-api
```

---

## Directory Structure

```
/Users/ankit/projects/test/
├── kite.js                 # Main trading script
├── api-server.js           # REST API server
├── supervisor.js           # Process supervisor
├── Dockerfile              # Docker image definition
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore          # Files to exclude from image
├── package.json           # Node.js dependencies
├── .env.enctoken          # Enctoken file (create manually)
├── logs/                  # Log files (persistent)
├── cache/                 # Cached data (persistent)
└── enctoken_backups/      # Enctoken backups (persistent)
```

---

## Docker Compose Configuration

The `docker-compose.yml` file sets up:

- **Port mapping**: 3000:3000
- **Volume mounts**:
  - `./logs` - Persist logs
  - `./cache` - Persist cached data
  - `./enctoken_backups` - Persist enctoken backups
  - `./.env.enctoken` - Mount enctoken file (read-only)
- **Environment**:
  - `NODE_ENV=production`
  - `TZ=Asia/Kolkata` (Indian timezone)
- **Restart policy**: `unless-stopped` (auto-restart on failure)
- **Health check**: Every 30 seconds

---

## Container Management

### View Container Status

```bash
docker ps
```

### View Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Filter by service
docker-compose logs kite-trading
```

### Execute Commands in Container

```bash
# Access container shell
docker exec -it kite-trading-api /bin/bash

# Run a command
docker exec kite-trading-api node -v
```

### Restart Container

```bash
docker-compose restart
```

### Stop and Remove

```bash
# Stop container
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Updating the Application

### Method 1: Rebuild Image

```bash
# Stop container
docker-compose down

# Rebuild image
docker-compose build

# Start with new image
docker-compose up -d
```

### Method 2: Hot Reload Files

Since logs, cache, and enctoken are mounted as volumes, you can update these without rebuilding:

```bash
# Update enctoken
echo 'ENCTOKEN="new_token"' > .env.enctoken

# Restart to pick up changes
docker-compose restart
```

---

## API Usage with Docker

Once the container is running, use the API:

### Update Enctoken (Recommended Method)

```bash
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "your_new_enctoken_here"}'
```

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

### Check Status

```bash
curl http://localhost:3000/api/status
```

### View Logs

```bash
curl http://localhost:3000/api/logs?lines=50
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

---

## Production Deployment

### Add Reverse Proxy with SSL

Use nginx or Caddy as a reverse proxy:

**docker-compose.yml** (with Caddy):

```yaml
version: '3.8'

services:
  kite-trading:
    build: .
    container_name: kite-trading-api
    volumes:
      - ./logs:/app/logs
      - ./cache:/app/cache
      - ./enctoken_backups:/app/enctoken_backups
      - ./.env.enctoken:/app/.env.enctoken:ro
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TZ=Asia/Kolkata
    restart: unless-stopped
    networks:
      - trading-network

  caddy:
    image: caddy:2-alpine
    container_name: caddy-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - trading-network
    restart: unless-stopped

networks:
  trading-network:

volumes:
  caddy_data:
  caddy_config:
```

**Caddyfile**:

```
trading.yourdomain.com {
    reverse_proxy kite-trading:3000
}
```

### Add Authentication

Update `api-server.js` to add API key authentication:

```javascript
// Simple API key middleware
const API_KEY = process.env.API_KEY || 'your-secret-key';

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  next();
}

// Apply to all /api routes
app.use('/api', authenticateApiKey);
```

Then set API_KEY in docker-compose.yml:

```yaml
environment:
  - API_KEY=your-secret-key-here
```

Usage:

```bash
curl http://localhost:3000/api/status \
  -H "X-API-Key: your-secret-key-here"
```

---

## Monitoring and Alerting

### Health Check Monitoring

```bash
# Simple uptime check script
#!/bin/bash
while true; do
  if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "ALERT: API is down!"
    # Send notification (email, Telegram, etc.)
  fi
  sleep 60
done
```

### Docker Health Status

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' kite-trading-api
```

### Log Monitoring

```bash
# Watch for errors in logs
docker logs -f kite-trading-api | grep ERROR
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Check if port is already in use
lsof -i :3000

# Check if enctoken file exists
ls -la .env.enctoken
```

### Permission issues

```bash
# Fix permissions on volumes
chmod 755 logs cache enctoken_backups
chmod 600 .env.enctoken
```

### Container keeps restarting

```bash
# View exit code and logs
docker inspect kite-trading-api | grep -A 5 State
docker logs kite-trading-api
```

### API not accessible

```bash
# Check container is running
docker ps

# Check port mapping
docker port kite-trading-api

# Test from inside container
docker exec kite-trading-api curl http://localhost:3000/health

# Test firewall
sudo ufw status
```

### Enctoken not working

```bash
# Check enctoken status via API
curl http://localhost:3000/api/enctoken/status

# Update enctoken
curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d '{"enctoken": "NEW_TOKEN"}'
```

---

## Backup and Recovery

### Backup Important Files

```bash
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup enctoken
cp .env.enctoken $BACKUP_DIR/

# Backup logs
cp -r logs $BACKUP_DIR/

# Backup cache
cp -r cache $BACKUP_DIR/

# Backup enctoken backups
cp -r enctoken_backups $BACKUP_DIR/

echo "Backup created: $BACKUP_DIR"
```

### Restore from Backup

```bash
#!/bin/bash
BACKUP_DIR="backups/20250115_093000"

# Restore enctoken
cp $BACKUP_DIR/.env.enctoken .

# Restore logs
cp -r $BACKUP_DIR/logs .

# Restore cache
cp -r $BACKUP_DIR/cache .

# Restart container
docker-compose restart
```

---

## Resource Limits

To prevent the container from consuming too many resources:

**docker-compose.yml**:

```yaml
services:
  kite-trading:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Multi-Environment Setup

### Development

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  kite-trading:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./:/app  # Mount source code for hot reload
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

Run: `docker-compose -f docker-compose.dev.yml up`

### Production

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  kite-trading:
    image: kite-trading-bot:latest
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/app/logs
      - ./cache:/app/cache
      - ./.env.enctoken:/app/.env.enctoken:ro
    environment:
      - NODE_ENV=production
    restart: always
```

Run: `docker-compose -f docker-compose.prod.yml up -d`

---

## Daily Routine with Docker

```bash
#!/bin/bash
# daily-trading.sh

# 1. Update enctoken (get from Kite website)
NEW_ENCTOKEN="your_new_enctoken"

curl -X POST http://localhost:3000/api/enctoken/update \
  -H "Content-Type: application/json" \
  -d "{\"enctoken\": \"$NEW_ENCTOKEN\"}"

# 2. Start trading
curl -X POST http://localhost:3000/api/trading/start \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "120395527",
    "tradingsymbol": "SILVERM25FEBFUT",
    "notimeexit": true
  }'

echo "Trading started. Monitor at: http://localhost:3000/api/logs"
```

Make it executable and schedule with cron:

```bash
chmod +x daily-trading.sh

# Add to crontab (run at 9:00 AM daily)
crontab -e
# Add: 0 9 * * * /path/to/daily-trading.sh
```

---

## Next Steps

1. ✅ Start the container: `docker-compose up -d`
2. ✅ Update enctoken: `curl -X POST http://localhost:3000/api/enctoken/update ...`
3. ✅ Start trading: `curl -X POST http://localhost:3000/api/trading/start ...`
4. ✅ Monitor: `curl http://localhost:3000/api/logs`

For API details, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
