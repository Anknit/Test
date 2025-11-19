#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🚀 Starting Kite Trading API Server"
echo "=========================================="
echo ""

# Check if .env.enctoken exists
if [ ! -f .env.enctoken ]; then
    echo -e "${RED}❌ Error: .env.enctoken file not found${NC}"
    echo ""
    echo "Please create it first:"
    echo '  echo '\''ENCTOKEN="your_enctoken_here"'\'' > .env.enctoken'
    echo '  chmod 600 .env.enctoken'
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo ""
    echo "Stop the existing process or use a different port:"
    echo "  PORT=3001 node api-server.js"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Enctoken file found${NC}"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ Port 3000 is available${NC}"
echo ""

# Create necessary directories
mkdir -p logs cache enctoken_backups

echo -e "${GREEN}Starting API server...${NC}"
echo ""

# Start the server
node api-server.js
