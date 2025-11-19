#!/bin/bash

# Quick Backtest Test Script

echo "======================================"
echo "🧪 Testing Backtest Functionality"
echo "======================================"
echo ""

cd /Users/ankit/projects/test

# Check if API server is running
echo "1. Checking if API server is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✓ API server is running"
else
    echo "   ✗ API server not running"
    echo "   Start it with: node api-server.js"
    exit 1
fi

# Check if enctoken exists
echo ""
echo "2. Checking enctoken file..."
if [ -f ".env.enctoken" ]; then
    echo "   ✓ Enctoken file exists"
else
    echo "   ✗ Enctoken file missing"
    echo "   Create it with: echo 'ENCTOKEN=\"your_token\"' > .env.enctoken"
    exit 1
fi

# Run a quick backtest
echo ""
echo "3. Running backtest (this may take 10-30 seconds)..."
timeout 60 node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit --days 30 2>&1 | tail -20

# Check if results file was created
echo ""
echo "4. Checking if results file was created..."
if [ -f "backtest_results.json" ]; then
    echo "   ✓ Results file exists"
    
    # Show file size
    size=$(ls -lh backtest_results.json | awk '{print $5}')
    echo "   File size: $size"
    
    # Validate JSON
    if cat backtest_results.json | jq . > /dev/null 2>&1; then
        echo "   ✓ Valid JSON"
        
        # Show key metrics
        echo ""
        echo "   📊 Quick Results:"
        echo "   Trades: $(cat backtest_results.json | jq -r '.trades')"
        echo "   Win Rate: $(cat backtest_results.json | jq -r '.winRate * 100')%"
        echo "   Total P&L: ₹$(cat backtest_results.json | jq -r '.totalPnl')"
        echo "   Profit Factor: $(cat backtest_results.json | jq -r '.profitFactor')"
    else
        echo "   ✗ Invalid JSON"
    fi
else
    echo "   ✗ Results file not created"
    echo "   Backtest may have failed"
fi

# Test API endpoint
echo ""
echo "5. Testing API endpoint..."
response=$(curl -s http://localhost:3000/api/backtest/results)
if echo "$response" | jq . > /dev/null 2>&1; then
    if echo "$response" | grep -q '"success":true'; then
        echo "   ✓ API endpoint works"
    else
        echo "   ✗ API returned error"
        echo "$response" | jq
    fi
else
    echo "   ✗ Invalid API response"
fi

echo ""
echo "======================================"
echo "✅ Test Complete!"
echo "======================================"
echo ""
echo "To view results:"
echo "1. Open http://localhost:3000"
echo "2. Click 'Backtest Results' tab"
echo "   or"
echo "   Click '📊 Load Results' button"
echo ""
