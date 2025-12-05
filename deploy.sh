#!/usr/bin/env bash
set -euo pipefail

# Load nvm to ensure npm is available
export NVM_DIR="${HOME}/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi
if [ -s "$NVM_DIR/bash_completion" ]; then
  . "$NVM_DIR/bash_completion"
fi

# Verify versions
node_version=$(node -v | cut -dv -f2)
npm_version=$(npm -v)
echo "Using Node.js v${node_version} and npm ${npm_version}"

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
