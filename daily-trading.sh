#!/bin/bash

# Kite Trading Bot - Daily Trading Routine
# This script automates the daily trading startup process

# ============================================
# Configuration
# ============================================

API_BASE_URL="http://localhost:3000"
INSTRUMENT="120395527"                      # SILVER futures token
TRADING_SYMBOL="SILVERM25FEBFUT"           # Trading symbol
PAPER_MODE=false                            # Set to true for paper trading
NO_TIME_EXIT=true                           # Disable time-based exits

# ============================================
# Color codes
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Functions
# ============================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_api_health() {
    if curl -s -f "$API_BASE_URL/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

get_enctoken_from_user() {
    echo ""
    echo "================================================"
    echo "How would you like to update enctoken?"
    echo "================================================"
    echo "1. Auto-login (EASIEST - just provide credentials)"
    echo "2. Manual (copy from browser)"
    echo ""
    read -p "Choose option (1 or 2): " choice
    echo ""

    if [ "$choice" = "1" ]; then
        # Auto-login method
        echo "================================================"
        echo "Kite Auto-Login"
        echo "================================================"
        echo ""

        read -p "Enter Kite User ID (e.g., AB1234): " USER_ID
        read -s -p "Enter Kite Password: " PASSWORD
        echo ""
        read -p "Enter 2FA Code (6 digits from authenticator app): " TOTP
        echo ""

        if [ -z "$USER_ID" ] || [ -z "$PASSWORD" ] || [ -z "$TOTP" ]; then
            log_error "All fields are required"
            exit 1
        fi

        log_info "Logging in to Kite and fetching enctoken..."

        response=$(curl -s -X POST "$API_BASE_URL/api/enctoken/login" \
            -H "Content-Type: application/json" \
            -d "{\"userId\": \"$USER_ID\", \"password\": \"$PASSWORD\", \"totp\": \"$TOTP\"}")

        if echo "$response" | grep -q '"success":true'; then
            log_success "Login successful! Enctoken updated automatically"
            return 0
        else
            log_error "Login failed"
            echo "$response"
            exit 1
        fi
    else
        # Manual method
        echo "================================================"
        echo "Manual Enctoken Update"
        echo "================================================"
        echo "1. Open https://kite.zerodha.com and login"
        echo "2. Press F12 to open DevTools"
        echo "3. Go to Application → Cookies → https://kite.zerodha.com"
        echo "4. Find 'enctoken' and copy its value"
        echo ""

        read -p "Enter your new enctoken: " NEW_ENCTOKEN

        if [ -z "$NEW_ENCTOKEN" ]; then
            log_error "Enctoken cannot be empty"
            exit 1
        fi

        echo "$NEW_ENCTOKEN"
    fi
}

update_enctoken() {
    local enctoken=$1

    log_info "Updating enctoken..."

    response=$(curl -s -X POST "$API_BASE_URL/api/enctoken/update" \
        -H "Content-Type: application/json" \
        -d "{\"enctoken\": \"$enctoken\"}")

    if echo "$response" | grep -q '"success":true'; then
        log_success "Enctoken updated successfully"
        return 0
    else
        log_error "Failed to update enctoken"
        echo "$response"
        return 1
    fi
}

check_enctoken_status() {
    log_info "Checking enctoken status..."

    response=$(curl -s "$API_BASE_URL/api/enctoken/status")

    if echo "$response" | grep -q '"valid":true'; then
        log_success "Enctoken is valid"
        return 0
    else
        log_warning "Enctoken is invalid or missing"
        return 1
    fi
}

start_trading() {
    log_info "Starting trading process..."

    # Build JSON payload
    json_payload=$(cat <<EOF
{
    "instrument": "$INSTRUMENT",
    "tradingsymbol": "$TRADING_SYMBOL",
    "paper": $PAPER_MODE,
    "notimeexit": $NO_TIME_EXIT
}
EOF
)

    response=$(curl -s -X POST "$API_BASE_URL/api/trading/start" \
        -H "Content-Type: application/json" \
        -d "$json_payload")

    if echo "$response" | grep -q '"success":true'; then
        log_success "Trading started successfully"

        # Extract PID if available
        pid=$(echo "$response" | grep -o '"pid":[0-9]*' | cut -d: -f2)
        if [ -n "$pid" ]; then
            log_info "Trading process PID: $pid"
        fi

        return 0
    else
        log_error "Failed to start trading"
        echo "$response"
        return 1
    fi
}

get_trading_status() {
    response=$(curl -s "$API_BASE_URL/api/status")

    if echo "$response" | grep -q '"success":true'; then
        echo "$response"
        return 0
    else
        log_error "Failed to get status"
        return 1
    fi
}

# ============================================
# Main Script
# ============================================

echo "================================================"
echo "🤖 Kite Trading Bot - Daily Startup"
echo "================================================"
echo ""

# Check if API server is running
log_info "Checking API server health..."
if check_api_health; then
    log_success "API server is running"
else
    log_error "API server is not running!"
    echo ""
    log_info "Please start the API server first:"
    echo "  Local: ./start-api.sh"
    echo "  Docker: docker-compose up -d"
    exit 1
fi

echo ""

# Check current enctoken status
if check_enctoken_status; then
    echo ""
    read -p "Enctoken is already valid. Do you want to update it? (y/N): " update_choice

    if [[ "$update_choice" =~ ^[Yy]$ ]]; then
        get_enctoken_from_user
        # Note: If auto-login is used, enctoken is updated automatically
        # If manual is used, update_enctoken is called with the returned value
        if [ -n "$NEW_ENCTOKEN" ]; then
            update_enctoken "$NEW_ENCTOKEN" || exit 1
        fi
    fi
else
    log_warning "You need to update the enctoken"
    get_enctoken_from_user
    # Note: If auto-login is used, enctoken is updated automatically
    # If manual is used, update_enctoken is called with the returned value
    if [ -n "$NEW_ENCTOKEN" ]; then
        update_enctoken "$NEW_ENCTOKEN" || exit 1
    fi
fi

echo ""

# Check if trading is already running
status=$(get_trading_status)
if echo "$status" | grep -q '"running":true'; then
    log_warning "Trading process is already running"
    echo ""
    read -p "Do you want to restart it? (y/N): " restart_choice

    if [[ "$restart_choice" =~ ^[Yy]$ ]]; then
        log_info "Stopping current process..."
        curl -s -X POST "$API_BASE_URL/api/trading/stop" > /dev/null
        sleep 3
        start_trading || exit 1
    else
        log_info "Keeping existing trading process"
    fi
else
    # Confirm before starting
    echo ""
    echo "================================================"
    echo "Trading Configuration:"
    echo "================================================"
    echo "Instrument: $INSTRUMENT"
    echo "Symbol: $TRADING_SYMBOL"
    echo "Paper Mode: $PAPER_MODE"
    echo "Time Exit Disabled: $NO_TIME_EXIT"
    echo ""

    if [ "$PAPER_MODE" = "true" ]; then
        log_warning "Running in PAPER TRADING mode (no real orders)"
    else
        log_warning "Running in LIVE TRADING mode (real money!)"
    fi

    echo ""
    read -p "Start trading with these settings? (y/N): " confirm

    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        start_trading || exit 1
    else
        log_info "Trading start cancelled by user"
        exit 0
    fi
fi

echo ""
echo "================================================"
echo "✅ Startup Complete"
echo "================================================"
echo ""
echo "Monitor your trading:"
echo "  Status: curl $API_BASE_URL/api/status | jq"
echo "  Logs:   curl $API_BASE_URL/api/logs?lines=50"
echo ""
echo "Stop trading:"
echo "  curl -X POST $API_BASE_URL/api/trading/stop"
echo ""
