#!/bin/bash

# Kite Trading Bot - Mobile App Build Script
# This script helps build the Android APK

set -e  # Exit on error

echo "======================================"
echo "Kite Trading Bot - Mobile App Builder"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to mobile app directory
cd "$(dirname "$0")/kite-mobile"

echo -e "${YELLOW}Step 1: Checking dependencies...${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

echo ""
echo -e "${YELLOW}Step 2: Checking EAS CLI...${NC}"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "EAS CLI not found. Installing globally..."
    npm install -g eas-cli
else
    echo -e "${GREEN}✓${NC} EAS CLI is installed"
fi

echo ""
echo -e "${YELLOW}Step 3: Checking Expo login...${NC}"
echo ""

# Check if logged in
if ! eas whoami &> /dev/null; then
    echo -e "${RED}✗${NC} Not logged into Expo"
    echo ""
    echo "Please login to Expo. If you don't have an account:"
    echo "  1. Go to: https://expo.dev/signup"
    echo "  2. Create a free account"
    echo "  3. Then come back and run this script again"
    echo ""
    read -p "Do you have an Expo account? (y/n): " has_account

    if [ "$has_account" = "y" ] || [ "$has_account" = "Y" ]; then
        echo ""
        echo "Running: eas login"
        eas login
    else
        echo ""
        echo -e "${RED}Please create an Expo account first:${NC}"
        echo "  https://expo.dev/signup"
        echo ""
        echo "Then run this script again."
        exit 1
    fi
else
    EXPO_USER=$(eas whoami)
    echo -e "${GREEN}✓${NC} Logged in as: $EXPO_USER"
fi

echo ""
echo -e "${YELLOW}Step 4: Building Android APK...${NC}"
echo ""

echo "This will:"
echo "  • Upload your project to Expo servers"
echo "  • Build Android APK (~10-20 minutes)"
echo "  • Provide download link when complete"
echo ""
read -p "Continue with build? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Build cancelled."
    exit 0
fi

echo ""
echo "Starting build..."
echo ""
echo -e "${YELLOW}⏳ This will take 10-20 minutes. You can close this terminal.${NC}"
echo -e "${YELLOW}   Check status at: https://expo.dev${NC}"
echo ""

# Start build
eas build --platform android --profile preview

echo ""
echo -e "${GREEN}======================================"
echo "Build Complete!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Download APK from the link above"
echo "  2. Transfer to your Android phone"
echo "  3. Enable 'Install unknown apps' in phone settings"
echo "  4. Open APK and install"
echo "  5. Follow setup guide: ../INSTALL_APK.md"
echo ""
echo -e "${YELLOW}Installation Guide:${NC} /Users/ankit/projects/test/INSTALL_APK.md"
echo ""
