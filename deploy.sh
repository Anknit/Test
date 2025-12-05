#!/usr/bin/env bash
set -euo pipefail

# Use absolute path for Node.js 24.11.1 (ubuntu user on Oracle VM)
NODE_PATH="/home/ubuntu/.nvm/versions/node/v24.11.1/bin/node"
NPM_PATH="/home/ubuntu/.nvm/versions/node/v24.11.1/bin/npm"

# Verify node and npm exist
if [ ! -f "$NODE_PATH" ]; then
  echo "ERROR: Node.js not found at $NODE_PATH"
  exit 1
fi

if [ ! -f "$NPM_PATH" ]; then
  echo "ERROR: npm not found at $NPM_PATH"
  exit 1
fi

# Add to PATH for subprocesses
export PATH="$(dirname "$NODE_PATH"):$PATH"
export NODE="$NODE_PATH"
export NPM="$NPM_PATH"

# Verify versions
node_version=$("$NODE_PATH" -v | cut -dv -f2)
npm_version=$("$NPM_PATH" -v)

echo "Using Node.js: $NODE_PATH (v${node_version})"
echo "Using npm: $NPM_PATH (${npm_version})"

if [ "$node_version" != "24.11.1" ]; then
  echo "ERROR: Node.js version mismatch. Expected 24.11.1 but got $node_version"
  exit 1
fi

if [ "$npm_version" != "11.6.2" ]; then
  echo "ERROR: npm version mismatch. Expected 11.6.2 but got $npm_version"
  exit 1
fi

# Simple deploy script for Oracle VM
# Assumes repository has been copied to $HOME/app by CI (scp) or pulled on the server

APP_DIR="${HOME}/app"
cd "$APP_DIR"

echo "Deploying app in $APP_DIR"

# Install dependencies (production)
if [ -f package-lock.json ]; then
  echo "Installing dependencies via npm ci (production)..."
  "$NPM" ci --only=production
else
  echo "Installing dependencies via npm install (production)..."
  "$NPM" install --only=production
fi

# Ensure runtime directories exist
mkdir -p logs cache enctoken_backups
chmod 700 logs cache enctoken_backups || true

# Ensure .env files have safe permissions if present
if [ -f .env.enctoken ]; then
  chmod 600 .env.enctoken || true
fi
if [ -f .env.email ]; then
  chmod 600 .env.email || true
fi

# Reload or start pm2 using ecosystem.config.js (preferred)
PM2_PATH="$(dirname "$NODE_PATH")/pm2"
if [ -f "$PM2_PATH" ] || command -v pm2 >/dev/null 2>&1; then
  if [ -f ecosystem.config.js ]; then
    echo "Reloading pm2 ecosystem..."
    pm2 reload ecosystem.config.js --env "${PM2_ENV:-production}" || pm2 start ecosystem.config.js --env "${PM2_ENV:-production}"
  else
    echo "ecosystem.config.js not found — starting api-server.js directly"
    pm2 reload api-server || pm2 start api-server.js --name kite-api --env "${PM2_ENV:-production}"
  fi
else
  echo "pm2 not found. Please install pm2 globally on the server: $NPM install -g pm2"
  exit 1
fi

echo "Deployment complete"
