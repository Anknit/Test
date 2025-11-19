#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Kite Trading Bot - API Test Suite"
echo "=========================================="
echo ""

# Base URL
BASE_URL="http://localhost:3000"

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -n "Testing: $description... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "1. Testing Health Check"
echo "----------------------------------------"
test_endpoint "GET" "/health" "" "Health endpoint"
echo ""

echo "2. Testing Status Endpoint"
echo "----------------------------------------"
test_endpoint "GET" "/api/status" "" "Get system status"
echo ""

echo "3. Testing Enctoken Status"
echo "----------------------------------------"
test_endpoint "GET" "/api/enctoken/status" "" "Get enctoken status"
echo ""

echo "4. Testing Logs Endpoint"
echo "----------------------------------------"
test_endpoint "GET" "/api/logs?lines=10" "" "Get last 10 logs"
echo ""

echo "5. Testing Cache Endpoint"
echo "----------------------------------------"
test_endpoint "GET" "/api/cache" "" "List cache files"
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
