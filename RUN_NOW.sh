#!/bin/bash

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   🤖 KITE TRADING BOT - QUICK START   ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "api-server.js" ]; then
    echo -e "${YELLOW}⚠️  Not in project directory. Navigating...${NC}"
    cd /Users/ankit/projects/test
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js not found!${NC}"
    echo "Please install Node.js from: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Installing...${NC}"
    npm install
fi

echo -e "${GREEN}✓ Dependencies ready${NC}"

# Check if .env.enctoken exists
if [ ! -f ".env.enctoken" ]; then
    echo -e "${YELLOW}⚠️  No enctoken file found.${NC}"
    echo ""
    read -p "Do you want to create it now? (y/N): " create_enctoken
    if [[ "$create_enctoken" =~ ^[Yy]$ ]]; then
        echo ""
        echo "You can leave it empty and update via dashboard later."
        read -p "Enter enctoken (or press Enter to skip): " enctoken
        if [ -z "$enctoken" ]; then
            echo 'ENCTOKEN="UPDATE_VIA_DASHBOARD"' > .env.enctoken
        else
            echo "ENCTOKEN=\"$enctoken\"" > .env.enctoken
        fi
        chmod 600 .env.enctoken
        echo -e "${GREEN}✓ Enctoken file created${NC}"
    else
        echo 'ENCTOKEN="UPDATE_VIA_DASHBOARD"' > .env.enctoken
        chmod 600 .env.enctoken
        echo -e "${GREEN}✓ Placeholder enctoken file created${NC}"
    fi
fi

echo -e "${GREEN}✓ Enctoken file found${NC}"

# Create directories if they don't exist
mkdir -p logs cache enctoken_backups

echo -e "${GREEN}✓ Directories ready${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🚀 Starting Kite Trading Bot API Server...${NC}"
echo ""
echo -e "${BLUE}📱 Access dashboard at:${NC}"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}💡 Quick actions:${NC}"
echo "   1. Open browser → http://localhost:3000"
echo "   2. Use Auto-Login to update enctoken"
echo "   3. Configure trading parameters"
echo "   4. Click Start Trading"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start the server
node api-server.js
