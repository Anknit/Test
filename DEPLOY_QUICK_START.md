# Deploy to Cloud - Quick Start (30 Minutes)

## 🚀 Fastest Path to Mobile Access

Follow these steps to deploy your Kite Trading Bot on Oracle Cloud Free Tier and access it from your mobile device.

---

## ⏱️ Timeline

- **5 min** - Create Oracle Cloud account
- **5 min** - Setup Ubuntu instance
- **10 min** - Install dependencies and deploy code
- **5 min** - Configure domain
- **5 min** - Setup SSL

**Total: ~30 minutes**

---

## 📝 Prerequisites

- [ ] Credit/debit card (for Oracle verification, not charged)
- [ ] Phone number (for verification)
- [ ] Your trading bot code ready

---

## 🎯 Step-by-Step

### 1. Create Oracle Cloud Account (5 min)

```
1. Go to: https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Fill form → Verify email → Verify phone
4. Add credit card (FREE, won't be charged)
5. Complete setup
```

### 2. Create Ubuntu Server (5 min)

```
1. Login to Oracle Cloud Console
2. Menu → Compute → Instances → Create Instance
3. Configure:
   Name: kite-trading-bot
   Image: Ubuntu 22.04
   Shape: VM.Standard.A1.Flex
   OCPUs: 4
   Memory: 24 GB
4. Download SSH key (save it!)
5. Click "Create"
6. Copy Public IP address
```

### 3. Open Firewall Ports (2 min)

```
1. Menu → Networking → Virtual Cloud Networks
2. Click your VCN → Default Security List
3. Add Ingress Rules:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3000 (API)
   All with Source: 0.0.0.0/0
```

### 4. Connect to Server (1 min)

```bash
# On your Mac/Linux
chmod 400 ~/Downloads/ssh-key.pem
ssh -i ~/Downloads/ssh-key.pem ubuntu@YOUR_PUBLIC_IP
```

### 5. Install Everything (5 min)

```bash
# One command to install all dependencies
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx git && \
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && \
sudo apt install -y nodejs
```

### 6. Deploy Your Code (3 min)

**Option A: Upload from your computer**

```bash
# On your Mac (new terminal)
cd /Users/ankit/projects/test
scp -i ~/Downloads/ssh-key.pem -r * ubuntu@YOUR_PUBLIC_IP:~/kite-trading-bot/
```

**Option B: On server**

```bash
# On server
mkdir ~/kite-trading-bot && cd ~/kite-trading-bot
# Then upload files via SFTP or copy-paste
```

### 7. Install App Dependencies (2 min)

```bash
cd ~/kite-trading-bot
npm install
echo 'ENCTOKEN="your_initial_token"' > .env.enctoken
chmod 600 .env.enctoken
```

### 8. Setup Nginx (3 min)

```bash
# Create config
sudo tee /etc/nginx/sites-available/kite-trading-bot > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/kite-trading-bot /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 9. Create Systemd Service (2 min)

```bash
sudo tee /etc/systemd/system/kite-trading-bot.service > /dev/null <<'EOF'
[Unit]
Description=Kite Trading Bot API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/kite-trading-bot
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node api-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable kite-trading-bot
sudo systemctl start kite-trading-bot
sudo systemctl status kite-trading-bot
```

### 10. Test Access (1 min)

```bash
# Test locally
curl http://localhost:3000/health

# Test via public IP
curl http://YOUR_PUBLIC_IP/health
```

### 11. Get Free Domain (5 min)

**Option A: Freenom (Free .tk domain)**

```
1. Go to: https://www.freenom.com
2. Search for: yourname.tk
3. Get it now (Free) → Continue
4. Use Free DNS → Continue
5. Complete registration
6. Go to: My Domains → Manage Domain → Manage Freenom DNS
7. Add Records:
   Name: @ → Type: A → Target: YOUR_PUBLIC_IP
   Name: www → Type: A → Target: YOUR_PUBLIC_IP
8. Save
```

**Option B: Use IP address**

```
Just use: http://YOUR_PUBLIC_IP
```

### 12. Setup SSL Certificate (3 min)

```bash
# Only if you have a domain
sudo certbot --nginx -d yourdomain.tk -d www.yourdomain.tk

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

---

## ✅ You're Done!

**Access your bot:**

- **With domain:** https://yourdomain.tk
- **With IP:** http://YOUR_PUBLIC_IP

**From mobile:**
1. Open browser
2. Go to your domain or IP
3. Add to home screen for quick access

---

## 📱 Mobile Access

### Add to Home Screen

**iPhone:**
```
Safari → Share → Add to Home Screen
```

**Android:**
```
Chrome → Menu (⋮) → Add to Home screen
```

---

## 🔐 Quick Security Setup (Optional, 5 min)

### 1. Setup Firewall

```bash
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

### 2. Change SSH Port (Recommended)

```bash
sudo nano /etc/ssh/sshd_config
# Change: Port 22 → Port 2222
sudo systemctl restart sshd

# Update firewall
sudo ufw allow 2222
sudo ufw delete allow 22

# Next time connect: ssh -p 2222 -i key.pem ubuntu@IP
```

### 3. Add API Key Authentication

Edit `api-server.js`:

```javascript
// Add after app.use(express.json());
const API_KEY = 'your-secret-key-12345';

app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

Restart:
```bash
sudo systemctl restart kite-trading-bot
```

Update frontend (`public/app.js`):

```javascript
// Add at top
const API_KEY = 'your-secret-key-12345';

// Update all fetch calls to include:
headers: {
  'X-API-Key': API_KEY
}
```

---

## 🆘 Troubleshooting

### Can't access from browser

```bash
# Check service
sudo systemctl status kite-trading-bot

# Check Nginx
sudo systemctl status nginx

# Check firewall in Oracle Cloud Console
# Security List → Ingress Rules → Port 80 allowed
```

### Service not starting

```bash
# View logs
sudo journalctl -u kite-trading-bot -n 50

# Check if port is in use
sudo netstat -tulpn | grep 3000

# Restart
sudo systemctl restart kite-trading-bot
```

### Domain not working

```bash
# Check DNS
ping yourdomain.tk

# Wait 10-30 minutes for DNS propagation
# Use IP address in the meantime
```

---

## 📊 Check Everything is Working

### 1. Service Status

```bash
sudo systemctl status kite-trading-bot
# Should show: active (running)
```

### 2. Nginx Status

```bash
sudo systemctl status nginx
# Should show: active (running)
```

### 3. Test API

```bash
# Health check
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}

# Status
curl http://localhost:3000/api/status
# Should return JSON with system status
```

### 4. Test from Phone

```
Open browser → Go to http://YOUR_IP
Should see dashboard
```

---

## 🎯 Daily Usage

### Morning Routine

```
1. Open https://yourdomain.tk on phone
2. Go to Auto-Login section
3. Enter credentials + 2FA
4. Click Login
5. Start Trading
6. Done!
```

### Stop Trading

```
1. Open dashboard
2. Click Stop Trading
3. Confirm
```

---

## 💡 Pro Tips

### 1. Bookmark on Phone

Save https://yourdomain.tk as bookmark or home screen icon.

### 2. Use Screen Lock

The domain/IP is public, add authentication (see security section).

### 3. Monitor Regularly

Check logs tab to see what your bot is doing.

### 4. Keep Backups

Backup your enctoken_backups directory weekly.

### 5. Update Regularly

```bash
cd ~/kite-trading-bot
git pull  # if using git
npm install
sudo systemctl restart kite-trading-bot
```

---

## 📋 Quick Commands

```bash
# View logs
sudo journalctl -u kite-trading-bot -f

# Restart service
sudo systemctl restart kite-trading-bot

# Check status
sudo systemctl status kite-trading-bot

# Update code
cd ~/kite-trading-bot && git pull
sudo systemctl restart kite-trading-bot

# View app logs
tail -f ~/kite-trading-bot/logs/supervisor.log

# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop
```

---

## 🎉 Success Checklist

- [ ] Oracle Cloud instance running
- [ ] Code deployed
- [ ] Service running (sudo systemctl status)
- [ ] Nginx running
- [ ] Firewall configured
- [ ] Can access via browser (http://YOUR_IP)
- [ ] Domain configured (optional)
- [ ] SSL installed (optional)
- [ ] Dashboard loads on mobile
- [ ] Can login and update enctoken
- [ ] Can start/stop trading

---

## 📞 Need Help?

### Check Logs First

```bash
# App logs
tail -100 ~/kite-trading-bot/logs/supervisor.log

# System logs
sudo journalctl -u kite-trading-bot -n 100

# Nginx logs
sudo tail -100 /var/log/nginx/error.log
```

### Common Issues

**Port 3000 already in use:**
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

**Permission denied:**
```bash
sudo chown -R ubuntu:ubuntu ~/kite-trading-bot
chmod +x ~/kite-trading-bot/*.sh
```

**Out of memory:**
```bash
free -h
# Oracle Free Tier has 24GB, should be plenty
# Restart service: sudo systemctl restart kite-trading-bot
```

---

## 🚀 You're Live!

Your Kite Trading Bot is now:
- ✅ Running on cloud server
- ✅ Accessible from anywhere
- ✅ Available on mobile
- ✅ Protected by firewall
- ✅ Secured with HTTPS (if domain)
- ✅ Auto-restarts on crash

**Access it at:**
- Domain: https://yourdomain.tk
- IP: http://YOUR_PUBLIC_IP

**Happy Trading! 📈🤖**
