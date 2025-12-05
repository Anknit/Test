#!/usr/bin/env bash
set -euo pipefail

# Find node and npm executables - nvm installs them under ~/.nvm/versions/node/
NODE_PATH=""
NPM_PATH=""

# Look for node in nvm directory (most recent version)
if [ -d "$HOME/.nvm/versions/node" ]; then
  NODE_DIR=$(ls -d "$HOME/.nvm/versions/node"/v* 2>/dev/null | sort -V | tail -1)
  if [ -n "$NODE_DIR" ] && [ -d "$NODE_DIR" ]; then
    NODE_PATH="$NODE_DIR/bin/node"
    NPM_PATH="$NODE_DIR/bin/npm"
  fi
fi

# Fall back to system node if nvm version not found
if [ -z "$NODE_PATH" ] || [ ! -f "$NODE_PATH" ]; then
  NODE_PATH=$(which node 2>/dev/null || echo "")
fi

if [ -z "$NPM_PATH" ] || [ ! -f "$NPM_PATH" ]; then
  NPM_PATH=$(which npm 2>/dev/null || echo "")
fi

# Verify we found node and npm
if [ -z "$NODE_PATH" ] || [ ! -f "$NODE_PATH" ]; then
  echo "ERROR: Could not find node executable at $NODE_PATH"
  echo "Checked: ~/.nvm/versions/node/*/bin/node and system PATH"
  exit 1
fi

if [ -z "$NPM_PATH" ] || [ ! -f "$NPM_PATH" ]; then
  echo "ERROR: Could not find npm executable at $NPM_PATH"
  exit 1
fi

# Export the paths for use in this script
export NODE="$NODE_PATH"
export NPM="$NPM_PATH"

# Add to PATH for subprocesses
export PATH="$(dirname "$NODE_PATH"):$PATH"

# Verify versions
node_version=$("$NODE" -v | cut -dv -f2)
npm_version=$("$NPM" -v)

echo "Using Node.js from: $NODE_PATH"
echo "Using npm from: $NPM_PATH"
echo "Node.js version: v${node_version}"
echo "npm version: ${npm_version}"

if [ "$node_version" != "24.11.1" ]; then
  echo "WARNING: Node.js version mismatch. Expected 24.11.1 but got $node_version"
fi

if [ "$npm_version" != "11.6.2" ]; then
  echo "WARNING: npm version mismatch. Expected 11.6.2 but got $npm_version"
fi

# Simple deploy script for Oracle VM
# Assumes repository has been copied to $HOME/app by CI (scp) or pulled on the server

APP_DIR="${HOME}/app"
cd "$APP_DIR"

echo "Deploying app in $APP_DIR"

# Install dependencies (production)
if [ -f package-lock.json ]; then
  echo "Installing dependencies via npm ci (production)..."
  npm ci --only=production
else
  echo "Installing dependencies via npm install (production)..."
  npm install --only=production
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
if command -v pm2 >/dev/null 2>&1; then
  if [ -f ecosystem.config.js ]; then
    echo "Reloading pm2 ecosystem..."
    pm2 reload ecosystem.config.js --env "${PM2_ENV:-production}" || pm2 start ecosystem.config.js --env "${PM2_ENV:-production}"
  else
    echo "ecosystem.config.js not found — starting api-server.js directly"
    pm2 reload api-server || pm2 start api-server.js --name kite-api --env "${PM2_ENV:-production}"
  fi
else
  echo "pm2 not found. Please install pm2 globally on the server: npm install -g pm2"
  exit 1
fi

echo "Deployment complete"
