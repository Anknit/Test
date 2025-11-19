# Auto-Login Feature Guide

## 🎉 What's New?

The Kite Trading Bot API now includes **automatic login** functionality! No more manual copying of enctoken from browser cookies every day. Just provide your credentials and 2FA code, and the bot will log in to Kite and fetch the enctoken automatically.

---

## 🚀 Quick Start

### Simple Example

```bash
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "AB1234",
    "password": "your_password",
    "totp": "123456"
  }'
```

**That's it!** The enctoken is fetched and updated automatically.

---

## 📋 How It Works

1. **You provide** your Kite credentials (user ID, password, 2FA code)
2. **API calls Kite login endpoint** with userId and password
3. **Receives request_id** from Kite server
4. **Submits 2FA code** with request_id to twofa endpoint
5. **Extracts enctoken** from Set-Cookie header in response
6. **Backs up old enctoken** (timestamped)
7. **Updates .env.enctoken** file
8. **Returns success** with enctoken preview

All of this happens in ~2-3 seconds using direct API calls!

---

## 📖 API Endpoint Details

### POST /api/enctoken/login

**Request:**
```json
{
  "userId": "AB1234",        // Your Zerodha user ID
  "password": "your_password", // Your Kite password
  "totp": "123456"           // 6-digit code from authenticator app
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful, enctoken updated",
  "data": {
    "enctokenLength": 250,
    "preview": "abcdefghij...xyz1234567"
  }
}
```

**Error Responses:**

**400 - Missing Credentials:**
```json
{
  "success": false,
  "error": "userId, password, and totp are required"
}
```

**400 - Invalid Format:**
```json
{
  "success": false,
  "error": "Invalid userId format. Should be like AB1234"
}
```

**401 - Login Failed:**
```json
{
  "success": false,
  "error": "Enctoken not found in cookies. Login may have failed."
}
```

**500 - Internal Error:**
```json
{
  "success": false,
  "error": "Internal error during login automation"
}
```

---

## 🔐 Getting Your 2FA Code (TOTP)

### Option 1: From Authenticator App

1. Open your authenticator app:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - etc.

2. Find "Zerodha Kite" entry

3. Copy the 6-digit code

4. **Use immediately** (expires in 30 seconds)

### Option 2: From Backup Codes

If you saved backup codes during 2FA setup, you can use those.

---

## 💻 Usage Examples

### 1. Using cURL (Command Line)

```bash
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "AB1234",
    "password": "MySecurePass123",
    "totp": "654321"
  }'
```

### 2. Using the Example Script

```bash
./example-auto-login.sh
```

This interactive script will:
- Prompt for credentials
- Make the API call
- Show success/failure
- Hide password input

### 3. Using the Daily Trading Script

```bash
./daily-trading.sh
```

When prompted to update enctoken:
- Choose option 1 (Auto-login)
- Enter credentials
- Enctoken is updated automatically

### 4. Using JavaScript/Node.js

```javascript
const axios = require('axios');

async function loginAndFetchEnctoken(userId, password, totp) {
  try {
    const response = await axios.post('http://localhost:3000/api/enctoken/login', {
      userId,
      password,
      totp
    });

    console.log('Login successful!');
    console.log('Enctoken preview:', response.data.data.preview);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
loginAndFetchEnctoken('AB1234', 'password', '123456')
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err));
```

### 5. Using Python

```python
import requests

def login_and_fetch_enctoken(user_id, password, totp):
    url = 'http://localhost:3000/api/enctoken/login'
    payload = {
        'userId': user_id,
        'password': password,
        'totp': totp
    }

    response = requests.post(url, json=payload)

    if response.status_code == 200:
        data = response.json()
        print('Login successful!')
        print('Enctoken preview:', data['data']['preview'])
        return data
    else:
        print('Login failed:', response.json())
        raise Exception('Login failed')

# Usage
login_and_fetch_enctoken('AB1234', 'password', '123456')
```

---

## 🔒 Security Considerations

### ⚠️ Important Security Notes

1. **Credentials are NOT stored**
   - Used only for login
   - Discarded after enctoken is fetched

2. **Use HTTPS in production**
   - Credentials are transmitted in plain text
   - Add SSL/TLS with reverse proxy (nginx, caddy)

3. **Add API authentication**
   - Restrict access to this endpoint
   - Use API keys or JWT tokens

4. **Limit access by IP**
   - Firewall rules
   - Only allow trusted IPs

5. **Monitor logs**
   - Check for unauthorized login attempts
   - Alert on failures

### Example: Adding IP Restriction

In [api-server.js](api-server.js):

```javascript
app.post('/api/enctoken/login', async (req, res) => {
  const allowedIPs = ['127.0.0.1', '::1', '192.168.1.100'];
  const clientIP = req.ip || req.connection.remoteAddress;

  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied from this IP'
    });
  }

  // ... rest of login logic
});
```

---

## 🛠️ Troubleshooting

### Login fails with "Enctoken not found"

**Possible causes:**
- Wrong password
- Expired TOTP (use fresh code)
- 2FA not properly entered
- Zerodha security check triggered

**Solution:**
- Verify credentials
- Get fresh TOTP code (use within 10 seconds)
- Check logs: `curl http://localhost:3000/api/logs?filter=Login`

### TOTP validation fails

**Error:** "Invalid TOTP format. Should be 6 digits"

**Cause:** TOTP is not 6 digits

**Solution:**
- Check authenticator app
- Ensure you're copying the full 6-digit code
- No spaces or special characters

### User ID validation fails

**Error:** "Invalid userId format. Should be like AB1234"

**Cause:** User ID doesn't match pattern (2 letters + 4-6 digits)

**Solution:**
- Check your Zerodha user ID
- Format: AB1234 (2 uppercase letters + digits)

### Timeout errors

**Error:** "Timeout exceeded" or "Navigation timeout"

**Cause:** Kite website is slow or unreachable

**Solution:**
- Check internet connection
- Try again after a few seconds
- Check Kite website status

### Browser launch fails (Docker)

**Error:** "Failed to launch the browser process"

**Cause:** Missing Chrome/Chromium dependencies in Docker

**Solution:**
- Already included in Dockerfile
- If using custom Docker image, install Chromium dependencies

---

## ⏱️ Best Practices

### 1. Daily Routine

Update enctoken before market open:

```bash
# Run this every morning before 9:15 AM IST
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "AB1234",
    "password": "your_password",
    "totp": "FRESH_CODE"
  }'
```

### 2. Automate with Cron (Advanced)

**⚠️ WARNING:** Storing passwords in scripts is risky. Use only on secure systems.

```bash
#!/bin/bash
# auto-update-enctoken.sh

# Get TOTP from command (requires oathtool)
TOTP=$(oathtool --totp --base32 "YOUR_2FA_SECRET")

curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"AB1234\", \"password\": \"$PASSWORD\", \"totp\": \"$TOTP\"}"
```

**Crontab:**
```
# Run at 9:00 AM IST every day
0 9 * * * /path/to/auto-update-enctoken.sh
```

### 3. Use Environment Variables

Store password securely:

```bash
export KITE_PASSWORD="your_password"
export KITE_USER_ID="AB1234"

# Then in script:
curl -X POST http://localhost:3000/api/enctoken/login \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$KITE_USER_ID\", \"password\": \"$KITE_PASSWORD\", \"totp\": \"$TOTP\"}"
```

---

## 📊 Comparison: Auto-Login vs Manual

| Feature | Auto-Login | Manual (Browser) |
|---------|-----------|------------------|
| **Steps required** | 1 API call | 5+ steps |
| **Time taken** | 10-15 seconds | 1-2 minutes |
| **Automation friendly** | ✅ Yes | ❌ No |
| **Risk of typo** | ❌ No | ✅ Yes |
| **Requires browser** | ❌ No | ✅ Yes |
| **Can be scheduled** | ✅ Yes | ❌ No |
| **Security concern** | ⚠️ Credentials sent | ✅ Manual only |

---

## 🎯 When to Use Each Method

### Use Auto-Login When:
- ✅ You update enctoken daily
- ✅ You want to automate the process
- ✅ API server is on secure network
- ✅ You have proper security measures

### Use Manual Update When:
- ✅ First-time setup
- ✅ Testing/debugging
- ✅ Unsure about security
- ✅ API server is publicly accessible

---

## 📚 Related Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [QUICK_START.md](QUICK_START.md) - Quick reference guide
- [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Deployment overview

---

## 🆘 Support

### Check Logs

```bash
# View all logs
curl http://localhost:3000/api/logs?lines=100

# Filter login-related logs
curl "http://localhost:3000/api/logs?filter=Login"

# Filter errors
curl "http://localhost:3000/api/logs?filter=ERROR"
```

### Test Enctoken Status

```bash
curl http://localhost:3000/api/enctoken/status
```

### Health Check

```bash
curl http://localhost:3000/health
```

---

## ✅ Checklist for First Use

- [ ] API server is running
- [ ] Kite user ID is correct format (AB1234)
- [ ] Password is correct
- [ ] 2FA/Authenticator app is set up
- [ ] Fresh TOTP code (< 10 seconds old)
- [ ] Internet connection is stable
- [ ] Logs directory is writable

---

## 🎉 Benefits

### Before (Manual Method)
1. Open browser
2. Login to kite.zerodha.com
3. Open DevTools (F12)
4. Navigate to Application → Cookies
5. Find and copy enctoken
6. Make API call or update file
7. Restart if needed

**Time: 1-2 minutes, Error-prone**

### After (Auto-Login)
1. Make one API call with credentials

**Time: 10-15 seconds, Automated**

---

**Happy Trading! 🚀**
