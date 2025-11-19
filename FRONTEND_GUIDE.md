# Frontend Dashboard Guide

## 🎉 New Web Dashboard!

A complete web-based dashboard has been added to control and monitor your Kite Trading Bot from your browser!

---

## 🚀 Quick Start

### 1. Start the API Server

```bash
# Local
./start-api.sh

# Or with Docker
docker-compose up -d
```

### 2. Open Your Browser

Navigate to: **http://localhost:3000**

That's it! The dashboard will load automatically.

---

## 📊 Dashboard Features

### 1. **System Status Panel**
Real-time monitoring of:
- Trading status (Running/Stopped)
- Process ID
- Uptime
- Enctoken validity

**Auto-refreshes every 5 seconds!**

### 2. **Auto-Login Form** 🔐
- Enter Kite credentials (User ID, Password, 2FA)
- Click "Login & Fetch Enctoken"
- Enctoken is fetched and updated automatically
- No more manual browser copy-paste!

### 3. **Trading Controls** 🎮
- Set instrument token and trading symbol
- Toggle paper trading mode
- Toggle time-based exit
- Start/Stop trading with one click

### 4. **Live Logs Viewer** 📝
- View real-time logs in a terminal-style interface
- Color-coded by severity:
  - 🔴 Errors (red)
  - 🟡 Warnings (yellow)
  - 🔵 Info (blue)
  - 🟢 Success (green)
- Filter logs by keyword
- Choose number of lines to display (50/100/200/500)
- Clear logs with one click

### 5. **Backtest Results** 📊
- Run backtests directly from the dashboard
- View comprehensive metrics:
  - Total P&L
  - Total Trades
  - Win Rate
  - Profit Factor
  - Average Win
  - Average Loss
- Color-coded cards (green for positive, red for negative)

### 6. **Cache Management** 💾
- View all cached data files
- See file sizes and modification dates
- Clear cache with one click

---

## 🎨 Features Breakdown

### Real-Time Status Monitoring

The dashboard automatically refreshes every 5 seconds to show:
- Whether trading is active
- Current process ID
- How long the bot has been running
- Whether your enctoken is valid

**Connection indicator** shows:
- 🟢 Green = Connected to API
- 🔴 Red = Disconnected

### Auto-Login Feature

**The easiest way to update your enctoken:**

1. Enter your Kite User ID (e.g., AB1234)
2. Enter your password
3. Get fresh 2FA code from authenticator app
4. Click "Login & Fetch Enctoken"
5. Done! Enctoken updated in ~2-3 seconds

**No need to:**
- Open browser manually
- Navigate to Kite
- Open DevTools
- Find cookies
- Copy enctoken

### Trading Controls

**Start Trading:**
1. Enter instrument token (default: SILVER futures)
2. Enter trading symbol
3. Optional: Enable paper trading mode (test without real money)
4. Optional: Disable time-based exits
5. Click "Start Trading"

**Stop Trading:**
- Click "Stop Trading"
- Confirm the action
- Bot stops gracefully

### Logs Viewer

**Features:**
- Terminal-style dark theme
- Auto-scrolls to bottom
- Filter by keyword (live search)
- Choose number of lines to display
- Refresh manually or auto-updates when tab is active
- Download full log file
- Clear logs (with backup)

**Keyboard shortcuts:**
- Type in filter box to search logs instantly
- Scroll with mouse or trackpad
- Use Ctrl+F for browser find

### Backtest Results Display

**After running a backtest, see:**

| Metric | Description |
|--------|-------------|
| Total P&L | Profit/Loss in rupees |
| Total Trades | Number of trades executed |
| Win Rate | Percentage of winning trades |
| Profit Factor | Ratio of wins to losses |
| Average Win | Average profit per winning trade |
| Average Loss | Average loss per losing trade |

**Visual indicators:**
- Green cards for positive metrics
- Red cards for negative metrics
- Large, easy-to-read numbers

---

## 📱 Responsive Design

The dashboard works on all devices:
- **Desktop** - Full layout with sidebar and main content
- **Tablet** - Stacked layout, all features accessible
- **Mobile** - Optimized for small screens, touch-friendly

---

## 🎯 Usage Examples

### Daily Routine

**Morning (Before Market Open):**
1. Open http://localhost:3000
2. Go to Auto-Login section
3. Enter credentials and fresh 2FA code
4. Click "Login & Fetch Enctoken"
5. Wait for success message
6. Set trading parameters
7. Click "Start Trading"

**During Market Hours:**
1. Monitor "Logs" tab for trade signals
2. Check "System Status" to ensure bot is running
3. View any errors or warnings

**After Market Close:**
1. Click "Stop Trading"
2. Review logs
3. Run backtest to analyze performance

### Testing New Strategy

1. Enable "Paper Trading Mode"
2. Set parameters
3. Click "Start Trading"
4. Monitor logs for signals
5. After sufficient time, stop trading
6. Run backtest
7. Analyze results
8. If satisfied, disable paper mode and go live

---

## 🔧 Technical Details

### File Structure

```
public/
├── index.html       # Main HTML structure
├── styles.css       # Responsive CSS styling
└── app.js          # JavaScript for API integration
```

### API Integration

The frontend uses the following API endpoints:
- `GET /health` - Connection check
- `GET /api/status` - System status
- `POST /api/enctoken/login` - Auto-login
- `POST /api/trading/start` - Start trading
- `POST /api/trading/stop` - Stop trading
- `GET /api/logs` - Fetch logs
- `POST /api/logs/clear` - Clear logs
- `POST /api/backtest/run` - Run backtest
- `GET /api/backtest/results` - Get results
- `GET /api/cache` - List cache files
- `POST /api/cache/clear` - Clear cache

### Auto-Refresh

- **System Status**: Refreshes every 5 seconds
- **Logs**: Manual refresh or when switching to Logs tab
- **Other Tabs**: Load when switched to

### Toast Notifications

All actions show toast notifications:
- 🟢 Green - Success
- 🔴 Red - Error
- 🟡 Yellow - Warning
- 🔵 Blue - Info

Notifications auto-dismiss after 4 seconds.

---

## 🎨 Customization

### Change Theme Colors

Edit `public/styles.css`:

```css
/* Primary color */
.btn-primary {
    background: #667eea; /* Change this */
}

/* Success color */
.btn-success {
    background: #10b981; /* Change this */
}
```

### Adjust Auto-Refresh Interval

Edit `public/app.js`:

```javascript
// Change from 5000ms (5 seconds) to desired interval
autoRefreshInterval = setInterval(() => {
    refreshStatus();
}, 5000); // Change this value
```

### Add Custom Tabs

1. Add tab button in HTML:
```html
<button class="tab-btn" onclick="showTab('custom')">Custom</button>
```

2. Add tab content:
```html
<div id="customTab" class="tab-content">
    <!-- Your content here -->
</div>
```

3. Add logic in `app.js`:
```javascript
if (tabName === 'custom') {
    loadCustomData();
}
```

---

## 🔒 Security Considerations

### Production Deployment

**Important security measures for production:**

1. **Add Authentication**
   - Implement login system
   - Use session management
   - Protect API endpoints

2. **Use HTTPS**
   - Set up SSL certificate
   - Use reverse proxy (nginx/caddy)
   - Redirect HTTP to HTTPS

3. **Restrict Access**
   - Use firewall rules
   - Whitelist IPs
   - Use VPN for remote access

4. **Secure Credentials**
   - Don't store passwords in browser
   - Clear form after login
   - Use strong passwords

### Example: Adding Basic Auth

Add to `api-server.js`:

```javascript
// Simple basic auth middleware
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || auth !== 'Bearer YOUR_SECRET_TOKEN') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
}

// Protect all API routes
app.use('/api', requireAuth);
```

Then update `public/app.js`:

```javascript
const API_TOKEN = 'YOUR_SECRET_TOKEN';

fetch(url, {
    headers: {
        'Authorization': `Bearer ${API_TOKEN}`
    }
})
```

---

## 📊 Screenshots

### Dashboard Overview
- Header with connection status
- Left sidebar with controls
- Main content area with tabs
- Real-time status updates

### Auto-Login Form
- Simple 3-field form
- User ID, Password, 2FA
- One-click login
- Success/error messages

### Trading Controls
- Instrument token input
- Trading symbol input
- Checkbox options
- Start/Stop buttons

### Logs Viewer
- Dark terminal-style interface
- Color-coded logs
- Filter and line count controls
- Auto-scroll to bottom

### Backtest Results
- Grid of metric cards
- Large, readable numbers
- Color-coded (green/red)
- Professional layout

---

## 🆘 Troubleshooting

### Dashboard Won't Load

**Problem:** Browser shows "Cannot connect"

**Solutions:**
1. Check API server is running: `curl http://localhost:3000/health`
2. Check port 3000 is not blocked by firewall
3. Try accessing from different browser
4. Check console for errors (F12 → Console)

### "Disconnected" Status

**Problem:** Red "Disconnected" badge in header

**Solutions:**
1. Refresh the page
2. Check API server is running
3. Check network connection
4. Look at browser console for errors

### Login Button Stuck on "Logging in..."

**Problem:** Button doesn't return to normal state

**Solutions:**
1. Check API server logs: `curl http://localhost:3000/api/logs?filter=Login`
2. Verify credentials are correct
3. Check 2FA code is fresh (not expired)
4. Refresh the page and try again

### Logs Not Loading

**Problem:** "Loading logs..." message doesn't go away

**Solutions:**
1. Check if log file exists: `ls -la logs/supervisor.log`
2. Check file permissions
3. Try with fewer lines (select "Last 50")
4. Check browser console for errors

### Backtest Results Empty

**Problem:** "No backtest results available"

**Solutions:**
1. Run a backtest first
2. Check if backtest completed successfully
3. Look at logs for backtest errors
4. Verify cache directory has data

---

## 🎯 Best Practices

### Daily Use

1. **Bookmark the dashboard**: http://localhost:3000
2. **Update enctoken first thing** every morning
3. **Check system status** before starting trading
4. **Monitor logs regularly** during market hours
5. **Stop trading** before market close
6. **Review backtest results** daily

### Performance

1. **Don't open multiple tabs** of the dashboard (causes multiple auto-refreshes)
2. **Clear logs periodically** to keep dashboard fast
3. **Clear cache** when not needed (frees up disk space)
4. **Use "Last 100" for logs** (default) - good balance

### Safety

1. **Always test in paper mode** first
2. **Verify enctoken is valid** before starting
3. **Monitor actively** during trading
4. **Have alerts** for errors (check logs)
5. **Keep backups** of enctoken backups directory

---

## 📚 Related Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [README.md](README.md) - Project overview
- [QUICK_START.md](QUICK_START.md) - Quick reference
- [AUTO_LOGIN_GUIDE.md](AUTO_LOGIN_GUIDE.md) - Login details

---

## ✅ Quick Reference

| Task | Action |
|------|--------|
| **Update enctoken** | Auto-Login form → Enter credentials → Login |
| **Start trading** | Trading Controls → Set params → Start Trading |
| **Stop trading** | Trading Controls → Stop Trading → Confirm |
| **View logs** | Logs tab → Select line count → Refresh |
| **Run backtest** | Backtest card → Run Backtest → Wait |
| **See results** | Backtest Results tab (or Load Results button) |
| **Check status** | Look at System Status card (auto-updates) |
| **Clear cache** | Cache tab → Clear Cache → Confirm |

---

**Enjoy your new web dashboard! 🎉**

**Access it at: http://localhost:3000**
