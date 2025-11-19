# Troubleshooting Backtest Results

## Issue: Backtest Results Not Showing in Dashboard

### Quick Fix

The backtest results should now be saved to `backtest_results.json` and displayed in the dashboard. Here's how to verify and fix:

---

## ✅ Step 1: Run a Backtest

### Option A: Via Dashboard

1. Open http://localhost:3000
2. Make sure enctoken is valid (use Auto-Login if needed)
3. Set parameters:
   - Instrument: `120395527`
   - Symbol: `SILVERM25FEBFUT`
4. Click **"🧪 Run Backtest"** in sidebar
5. Wait for completion toast
6. Click **"📊 Load Results"** or switch to **Backtest Results** tab

### Option B: Via Command Line

```bash
cd /Users/ankit/projects/test

# Run backtest directly
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit
```

After running, you should see:
```
=== BACKTEST RESULTS ===
Trades: 130
Win Rate: 38.46%
Total P&L: ₹192,936.85
...
✓ Backtest results saved to /Users/ankit/projects/test/backtest_results.json
```

---

## ✅ Step 2: Verify Results File

```bash
# Check if file exists
ls -la backtest_results.json

# View contents
cat backtest_results.json
```

You should see JSON like:
```json
{
  "timestamp": "2025-01-24T...",
  "instrument": "120395527",
  "tradingsymbol": "SILVERM25FEBFUT",
  "trades": 130,
  "winRate": 0.3846,
  "totalPnl": 192936.85,
  "profitFactor": 2.09,
  ...
}
```

---

## ✅ Step 3: Test API Endpoint

```bash
# Test if API can read the file
curl http://localhost:3000/api/backtest/results | jq
```

Expected response:
```json
{
  "success": true,
  "data": {
    "timestamp": "...",
    "trades": 130,
    "winRate": 0.3846,
    "totalPnl": 192936.85,
    ...
  }
}
```

---

## ✅ Step 4: Check Dashboard

1. Open http://localhost:3000
2. Click **"Backtest Results"** tab
3. Or click **"📊 Load Results"** button

You should see 6 metric cards:
- Total P&L
- Total Trades
- Win Rate
- Profit Factor
- Avg Win
- Avg Loss

---

## 🔧 Common Issues & Fixes

### Issue 1: "No backtest results available"

**Cause:** Results file doesn't exist or is empty

**Fix:**
```bash
# Run a backtest first
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit

# Check if file was created
ls -la backtest_results.json
```

### Issue 2: "Error loading results"

**Cause:** Permission issues or corrupted JSON

**Fix:**
```bash
# Fix permissions
chmod 644 backtest_results.json

# Validate JSON
cat backtest_results.json | jq

# If corrupted, delete and run backtest again
rm backtest_results.json
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit
```

### Issue 3: Results not updating

**Cause:** Old results cached in browser

**Fix:**
```bash
# Hard refresh browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + F5

# Or clear browser cache
```

### Issue 4: Enctoken error during backtest

**Cause:** Invalid or missing enctoken

**Fix:**
```bash
# Update enctoken via dashboard
# Or manually:
echo 'ENCTOKEN="your_new_enctoken"' > .env.enctoken

# Or use the API
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"AB1234","password":"pass","totp":"123456"}'
```

### Issue 5: No cache data

**Cause:** First run, no cached historical data

**Fix:**
```bash
# Run backtest once to fetch and cache data
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit

# This will fetch data from Kite API and cache it
# Next runs will be faster using cached data
```

---

## 🧪 Complete Test Sequence

Run this to test everything:

```bash
# 1. Start API server (in one terminal)
cd /Users/ankit/projects/test
node api-server.js

# 2. In another terminal, run backtest
cd /Users/ankit/projects/test
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit

# 3. Verify results file
cat backtest_results.json | jq

# 4. Test API endpoint
curl http://localhost:3000/api/backtest/results | jq

# 5. Open browser
open http://localhost:3000

# 6. Click "Backtest Results" tab
# You should see the metrics!
```

---

## 📊 Expected Output

### Terminal Output (from kite.js)
```
Fetching historical 120395527 from 2024-12-25 to 2025-01-24...
✓ Loaded 5000 bars from cache
Bars available: 5000

=== BACKTEST RESULTS ===
Trades: 130
Win Rate: 38.46%
Total P&L: ₹192,936.85
Final Equity: ₹642,936.85
Avg Win: ₹16,394.61
Avg Loss: ₹-7,834.92
Profit Factor: 2.09

✓ Backtest results saved to backtest_results.json
```

### Dashboard Display
```
┌─────────────────────────────────────┐
│ Total P&L                           │
│ ₹192,936                            │
│ (Green card)                        │
├─────────────────────────────────────┤
│ Total Trades     │ Win Rate         │
│ 130              │ 38.46%           │
├─────────────────────────────────────┤
│ Profit Factor    │ Avg Win          │
│ 2.09             │ ₹16,394          │
│ (Green)          │ (Green)          │
├─────────────────────────────────────┤
│ Avg Loss                            │
│ ₹-7,834                             │
│ (Red)                               │
└─────────────────────────────────────┘
```

---

## 🔍 Debug Mode

If still not working, enable debug logging:

### 1. Check Browser Console

Open browser → Press F12 → Console tab

Look for errors like:
- `Failed to fetch`
- `Unexpected token`
- `Network error`

### 2. Check API Server Logs

In terminal where api-server.js is running, look for:
```
GET /api/backtest/results 200
```

### 3. Check File Permissions

```bash
ls -la backtest_results.json
# Should show: -rw-r--r--
```

### 4. Validate JSON

```bash
# Check if JSON is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('backtest_results.json')))"
```

---

## 💡 Pro Tips

### 1. Keep Results Updated

After each backtest, the file updates automatically. Just click "Load Results" in dashboard.

### 2. Compare Results

Save multiple results:
```bash
# Run backtest
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit

# Save a copy
cp backtest_results.json backtest_results_$(date +%Y%m%d).json

# Run with different parameters
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT
# (without --notimeexit)

# Compare
cat backtest_results.json | jq '.totalPnl'
cat backtest_results_20250124.json | jq '.totalPnl'
```

### 3. Auto-Refresh Dashboard

Add to browser console (F12):
```javascript
// Auto-reload backtest results every 30 seconds
setInterval(() => {
  if (document.querySelector('.tab-content.active')?.id === 'backtestTab') {
    loadBacktestResults();
  }
}, 30000);
```

---

## 📋 Checklist

Before reporting an issue, check:

- [ ] API server is running (`curl http://localhost:3000/health`)
- [ ] Backtest has been run at least once
- [ ] `backtest_results.json` file exists
- [ ] File has valid JSON content (`cat backtest_results.json | jq`)
- [ ] API endpoint works (`curl http://localhost:3000/api/backtest/results`)
- [ ] Browser console shows no errors (F12 → Console)
- [ ] Dashboard is connected (green indicator in header)
- [ ] Tried hard refresh (Cmd+Shift+R or Ctrl+F5)

---

## ✅ Success Indicators

You'll know it's working when:

1. ✓ Backtest runs without errors
2. ✓ See "✓ Backtest results saved to..." message
3. ✓ `backtest_results.json` file exists
4. ✓ API endpoint returns JSON with results
5. ✓ Dashboard shows 6 metric cards with values
6. ✓ Green/red colors on P&L and Profit Factor

---

## 🆘 Still Not Working?

### Quick Reset

```bash
# Stop API server (Ctrl+C)

# Clean up
rm backtest_results.json
rm -rf cache/*
rm -rf logs/*

# Restart
node api-server.js

# In another terminal, run backtest
node kite.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --notimeexit

# Refresh browser
# Click "Load Results"
```

### Manual Test

```bash
# Create a test results file
cat > backtest_results.json << 'EOF'
{
  "timestamp": "2025-01-24T10:00:00.000Z",
  "instrument": "120395527",
  "tradingsymbol": "SILVERM25FEBFUT",
  "trades": 100,
  "winRate": 0.40,
  "totalPnl": 50000,
  "finalEquity": 500000,
  "avgWin": 2000,
  "avgLoss": -1500,
  "profitFactor": 1.33
}
EOF

# Test API
curl http://localhost:3000/api/backtest/results | jq

# Check dashboard
open http://localhost:3000
```

If this test file shows up in dashboard, the problem is with the backtest execution, not the display.

---

**Need more help? Check the logs!**

```bash
# App logs
tail -f logs/supervisor.log

# Look for errors
grep ERROR logs/supervisor.log
```
