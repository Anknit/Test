#!/bin/bash

# Kite Trading Bot - Local APK Build Script
# Builds APK locally without Expo account

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}======================================"
echo "Kite Trading Bot - Local APK Builder"
echo "No Expo Account Required!"
echo "======================================${NC}"
echo ""

# Navigate to mobile app directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/kite-mobile"

echo -e "${YELLOW}Step 1/5: Checking dependencies...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js first"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm: $(npm --version)"

# Install/check project dependencies
if [ ! -d "node_modules" ]; then
    echo ""
    echo "Installing project dependencies..."
    npm install
else
    echo -e "${GREEN}✓${NC} Project dependencies installed"
fi

echo ""
echo -e "${YELLOW}Step 2/5: Checking Android build tools...${NC}"
echo ""

# Check for Java
if ! command -v java &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  Java not found. Attempting to install..."
    if command -v brew &> /dev/null; then
        echo "Installing OpenJDK via Homebrew..."
        brew install openjdk@17
        export JAVA_HOME=/opt/homebrew/opt/openjdk@17
        export PATH="$JAVA_HOME/bin:$PATH"
    else
        echo -e "${RED}✗ Java required but not found${NC}"
        echo "Please install Java JDK 11 or later"
        echo "  brew install openjdk@17"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Java: $(java -version 2>&1 | head -n 1)"
fi

# Set JAVA_HOME if not set
if [ -z "$JAVA_HOME" ]; then
    if [ -d "/opt/homebrew/opt/openjdk@17" ]; then
        export JAVA_HOME=/opt/homebrew/opt/openjdk@17
        export PATH="$JAVA_HOME/bin:$PATH"
        echo -e "${GREEN}✓${NC} JAVA_HOME set to: $JAVA_HOME"
    elif [ -d "/Library/Java/JavaVirtualMachines" ]; then
        JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null)
        export JAVA_HOME
        echo -e "${GREEN}✓${NC} JAVA_HOME set to: $JAVA_HOME"
    fi
fi

echo ""
echo -e "${YELLOW}Step 3/5: Generating Android project...${NC}"
echo ""

# Check if android directory exists
if [ -d "android" ]; then
    echo "Android project already exists."
    read -p "Regenerate? This will overwrite any manual changes (y/n): " regen
    if [ "$regen" = "y" ] || [ "$regen" = "Y" ]; then
        echo "Removing existing android directory..."
        rm -rf android
        echo "Generating fresh Android project..."
        npx expo prebuild --platform android
    else
        echo "Using existing Android project..."
    fi
else
    echo "Generating Android project files..."
    npx expo prebuild --platform android
fi

echo ""
echo -e "${YELLOW}Step 4/5: Building APK...${NC}"
echo ""

cd android

# Make gradlew executable
chmod +x gradlew

echo "Choose build type:"
echo "  1. Debug APK (faster, ~5 minutes, larger size)"
echo "  2. Release APK (slower, ~10 minutes, optimized)"
echo ""
read -p "Enter choice (1 or 2): " build_choice

if [ "$build_choice" = "2" ]; then
    echo ""
    echo "Building Release APK..."
    echo -e "${YELLOW}⏳ This will take 5-10 minutes...${NC}"
    echo ""
    ./gradlew assembleRelease

    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    APK_TYPE="release"
else
    echo ""
    echo "Building Debug APK..."
    echo -e "${YELLOW}⏳ This will take 3-5 minutes...${NC}"
    echo ""
    ./gradlew assembleDebug

    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    APK_TYPE="debug"
fi

echo ""
echo -e "${YELLOW}Step 5/5: Installing on phone...${NC}"
echo ""

# Check if APK was created
if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}✗ APK not found at: $APK_PATH${NC}"
    exit 1
fi

APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
echo -e "${GREEN}✓ APK built successfully!${NC}"
echo "  Location: $(pwd)/$APK_PATH"
echo "  Size: $APK_SIZE"
echo ""

# Check if adb is available
if command -v adb &> /dev/null; then
    echo "Checking for connected Android devices..."

    # Check for devices
    DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)

    if [ "$DEVICES" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Android device connected"
        echo ""
        read -p "Install APK on phone now? (y/n): " install_now

        if [ "$install_now" = "y" ] || [ "$install_now" = "Y" ]; then
            echo ""
            echo "Installing APK on phone..."
            adb install -r "$APK_PATH"

            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}✓ APK installed successfully!${NC}"
                echo ""
                echo "Open 'Kite Trading Bot' app on your phone to start."
            else
                echo -e "${RED}✗ Installation failed${NC}"
                echo "Try manual installation (see below)"
            fi
        fi
    else
        echo -e "${YELLOW}⚠ No Android device connected${NC}"
        echo ""
        echo "To install:"
        echo "  1. Enable USB debugging on phone"
        echo "  2. Connect phone via USB"
        echo "  3. Run: adb install -r $APK_PATH"
        echo ""
        echo "Or install manually (see instructions below)"
    fi
else
    echo -e "${YELLOW}⚠ adb not found${NC}"
    echo ""
    echo "Install adb with: brew install android-platform-tools"
    echo ""
    echo "Or install APK manually (see instructions below)"
fi

echo ""
echo -e "${GREEN}======================================"
echo "Build Complete!"
echo "======================================${NC}"
echo ""
echo -e "${BLUE}APK Location:${NC}"
echo "  $SCRIPT_DIR/kite-mobile/android/$APK_PATH"
echo ""
echo -e "${BLUE}APK Type:${NC} $APK_TYPE"
echo -e "${BLUE}APK Size:${NC} $APK_SIZE"
echo ""
echo -e "${BLUE}Manual Installation:${NC}"
echo "  1. Copy APK to phone's Download folder"
echo "  2. On phone: Files → Downloads → Tap APK"
echo "  3. Tap 'Install'"
echo "  4. Enable 'Install unknown apps' if prompted"
echo ""
echo -e "${BLUE}Via USB:${NC}"
echo "  adb install -r $SCRIPT_DIR/kite-mobile/android/$APK_PATH"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Launch app on phone"
echo "  2. Enter server URL: http://YOUR_IP:3000"
echo "  3. Enter API key from: cat $SCRIPT_DIR/.env | grep API_KEY"
echo "  4. Test connection and start trading!"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  $SCRIPT_DIR/LOCAL_BUILD_GUIDE.md"
echo ""
