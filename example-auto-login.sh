#!/bin/bash

# Example: Auto-login to Kite and fetch enctoken
# This is the EASIEST way to update your enctoken daily!

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔐 Kite Auto-Login Example"
echo "=========================================="
echo ""

# Configuration
API_URL="http://localhost:3000"

# Prompt for credentials
read -p "Enter Kite User ID (e.g., AB1234): " USER_ID
read -s -p "Enter Kite Password: " PASSWORD
echo ""
read -p "Enter 2FA Code (6 digits): " TOTP
echo ""

if [ -z "$USER_ID" ] || [ -z "$PASSWORD" ] || [ -z "$TOTP" ]; then
    echo -e "${RED}❌ All fields are required${NC}"
    exit 1
fi

echo -e "${YELLOW}Logging in to Kite...${NC}"
echo ""

# Make API call
response=$(curl -s -X POST "$API_URL/api/enctoken/login" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"password\": \"$PASSWORD\", \"totp\": \"$TOTP\"}")

# Check response
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Login successful!${NC}"
    echo -e "${GREEN}✓ Enctoken has been updated automatically${NC}"
    echo ""

    # Extract preview
    preview=$(echo "$response" | grep -o '"preview":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$preview" ]; then
        echo "Enctoken preview: $preview"
    fi

    echo ""
    echo "You can now start trading:"
    echo "  curl -X POST $API_URL/api/trading/start \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -d '{\"instrument\": \"120395527\", \"tradingsymbol\": \"SILVERM25FEBFUT\", \"notimeexit\": true}'"
else
    echo -e "${RED}❌ Login failed${NC}"
    echo ""
    echo "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    exit 1
fi
