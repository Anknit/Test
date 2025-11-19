# Cloud Deployment Guide - Free Linux Server

## 🌐 Deploy Your Trading Bot to Access from Mobile

This guide covers deploying your Kite Trading Bot on free Linux servers with domain access.

---

## 📋 Table of Contents

1. [Free Hosting Options](#free-hosting-options)
2. [Option 1: Oracle Cloud (Recommended)](#option-1-oracle-cloud-recommended)
3. [Option 2: AWS Free Tier](#option-2-aws-free-tier)
4. [Option 3: Google Cloud](#option-3-google-cloud)
5. [Domain Setup](#domain-setup)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Security Hardening](#security-hardening)
8. [Mobile Access](#mobile-access)

---

## 🆓 Free Hosting Options

### Comparison Table

| Provider | RAM | CPU | Storage | Network | Free Duration |
|----------|-----|-----|---------|---------|---------------|
| **Oracle Cloud** | 24GB | 4 vCPU | 200GB | Unlimited | Forever |
| **AWS Free Tier** | 1GB | 1 vCPU | 30GB | 15GB/month | 12 months |
| **Google Cloud** | 2GB | 1 vCPU | 30GB | 1GB/month | Forever (limited) |
| **Azure** | 1GB | 1 vCPU | 64GB | 15GB/month | 12 months |

**Recommendation:** Oracle Cloud (best specs, truly free forever)

---

## 🥇 Option 1: Oracle Cloud (Recommended)

### Why Oracle Cloud?

✅ **Best free tier** - 24GB RAM, 4 vCPU
✅ **Forever free** - No time limit
✅ **Generous** - 200GB storage, unlimited network
✅ **Reliable** - Enterprise-grade infrastructure

### Step-by-Step Setup

#### 1. Create Oracle Cloud Account

1. Go to: https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Fill registration form
4. Verify email and phone
5. Add credit card (won't be charged for free tier)

#### 2. Create Ubuntu Instance

```bash
# In Oracle Cloud Console:

1. Menu → Compute → Instances
2. Click "Create Instance"
3. Configure:
   - Name: kite-trading-bot
   - Image: Ubuntu 22.04 LTS
   - Shape: VM.Standard.A1.Flex (ARM)
     - OCPUs: 4
     - Memory: 24 GB
   - Network: Create new VCN (default)
   - SSH Keys: Generate or upload your key
4. Click "Create"
5. Wait 2-3 minutes for provisioning
```

#### 3. Configure Security List (Firewall)

```bash
# Open ports for HTTP, HTTPS, and your app

1. Menu → Networking → Virtual Cloud Networks
2. Click your VCN → Security Lists → Default Security List
3. Add Ingress Rules:

   Rule 1 (HTTP):
   - Source CIDR: 0.0.0.0/0
   - IP Protocol: TCP
   - Destination Port: 80

   Rule 2 (HTTPS):
   - Source CIDR: 0.0.0.0/0
   - IP Protocol: TCP
   - Destination Port: 443

   Rule 3 (API):
   - Source CIDR: 0.0.0.0/0
   - IP Protocol: TCP
   - Destination Port: 3000
```

#### 4. Connect to Server

```bash
# Get public IP from Oracle Console
# Instance Details → Primary VNIC → Public IP

# Connect via SSH
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_PUBLIC_IP
```

#### 5. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker (optional but recommended)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install -y docker-compose

# Install Git
sudo apt install -y git

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### 6. Deploy Your Application

```bash
# Create app directory
mkdir -p ~/kite-trading-bot
cd ~/kite-trading-bot

# Clone or upload your code
# Option A: Upload via SCP
# On your local machine:
scp -i ~/.ssh/your-key.pem -r /Users/ankit/projects/test/* ubuntu@YOUR_PUBLIC_IP:~/kite-trading-bot/

# OR Option B: Use Git
git clone YOUR_REPO_URL .

# Install dependencies
npm install

# Create enctoken file
echo 'ENCTOKEN="your_enctoken_here"' > .env.enctoken
chmod 600 .env.enctoken
```

#### 7. Setup Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/kite-trading-bot
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kite-trading-bot /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 8. Setup Systemd Service

```bash
# Create systemd service
sudo nano /etc/systemd/system/kite-trading-bot.service
```

Paste this:

```ini
[Unit]
Description=Kite Trading Bot API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/kite-trading-bot
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /home/ubuntu/kite-trading-bot/api-server.js
Restart=always
RestartSec=10
StandardOutput=append:/home/ubuntu/kite-trading-bot/logs/app.log
StandardError=append:/home/ubuntu/kite-trading-bot/logs/app-error.log

[Install]
WantedBy=multi-user.target
```

Start the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable kite-trading-bot

# Start the service
sudo systemctl start kite-trading-bot

# Check status
sudo systemctl status kite-trading-bot
```

---

## 🌐 Domain Setup

### Option 1: Free Domain (Recommended for Testing)

**Freenom** - Free domains (.tk, .ml, .ga, .cf, .gq)

1. Go to: https://www.freenom.com
2. Search for available domain
3. Select domain and checkout (free)
4. Go to "Services → My Domains → Manage Domain"
5. Click "Manage Freenom DNS"
6. Add A Record:
   - Name: @ (or leave blank)
   - Type: A
   - TTL: 3600
   - Target: YOUR_ORACLE_PUBLIC_IP
7. Add A Record for www:
   - Name: www
   - Type: A
   - TTL: 3600
   - Target: YOUR_ORACLE_PUBLIC_IP
8. Save changes

**Wait 10-30 minutes for DNS propagation**

### Option 2: Paid Domain

**Namecheap** - Cheap domains (~$10/year)

1. Buy domain from: https://www.namecheap.com
2. Go to Domain List → Manage
3. Advanced DNS → Add New Record:
   - Type: A Record
   - Host: @
   - Value: YOUR_ORACLE_PUBLIC_IP
   - TTL: Automatic
4. Add another A Record:
   - Type: A Record
   - Host: www
   - Value: YOUR_ORACLE_PUBLIC_IP
   - TTL: Automatic
5. Save

### Option 3: Free Subdomain

**No-IP** - Free dynamic DNS

1. Go to: https://www.noip.com
2. Sign up for free account
3. Create hostname: yourname.ddns.net
4. Point to your Oracle IP
5. Use their dynamic update client

---

## 🔒 SSL/HTTPS Setup (Free)

### Using Let's Encrypt (Certbot)

```bash
# Make sure your domain points to your server IP
# Test with: ping yourdomain.com

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to ToS
# - Choose to redirect HTTP to HTTPS (option 2)

# Certbot will automatically:
# - Get certificate
# - Update Nginx config
# - Setup auto-renewal

# Test auto-renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates
```

Your site is now accessible via HTTPS! 🎉

---

## 🔐 Security Hardening

### 1. Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to app port (optional - Nginx proxies)
# sudo ufw allow 3000/tcp

# Check status
sudo ufw status
```

### 2. Add API Authentication

Create auth middleware in `api-server.js`:

```javascript
// Add at the top of api-server.js
const API_KEY = process.env.API_KEY || 'your-secure-random-key-here';

// Authentication middleware
function authenticateApiKey(req, res, next) {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid API Key'
    });
  }

  next();
}

// Apply to all /api routes
app.use('/api', authenticateApiKey);
```

Update systemd service:

```bash
sudo nano /etc/systemd/system/kite-trading-bot.service

# Add under [Service]:
Environment=API_KEY=your-super-secret-key-12345
```

Restart service:

```bash
sudo systemctl daemon-reload
sudo systemctl restart kite-trading-bot
```

### 3. Update Frontend for Auth

Edit `public/app.js`:

```javascript
// Add at top
const API_KEY = 'your-super-secret-key-12345'; // Store securely!

// Update all fetch calls
fetch(`${API_BASE}/api/status`, {
    headers: {
        'X-API-Key': API_KEY
    }
})
```

### 4. Rate Limiting

Install and configure:

```bash
npm install express-rate-limit
```

Add to `api-server.js`:

```javascript
const rateLimit = require('express-rate-limit');

// Limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { success: false, error: 'Too many login attempts' }
});

app.post('/api/enctoken/login', loginLimiter, async (req, res) => {
  // ... existing code
});
```

### 5. Fail2Ban (Block Brute Force)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create custom jail
sudo nano /etc/fail2ban/jail.local
```

Paste:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22

[nginx-http-auth]
enabled = true
port = http,https
```

Start Fail2Ban:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status
```

---

## 📱 Mobile Access

### Setup

Once deployed, access from mobile:

```
https://yourdomain.com
```

### Add to Home Screen (PWA-like)

**iPhone:**
1. Open Safari
2. Go to https://yourdomain.com
3. Tap Share button
4. Tap "Add to Home Screen"
5. Name it "Trading Bot"
6. Tap "Add"

**Android:**
1. Open Chrome
2. Go to https://yourdomain.com
3. Tap ⋮ (menu)
4. Tap "Add to Home screen"
5. Name it "Trading Bot"
6. Tap "Add"

### Mobile-Optimized Features

The dashboard is already mobile-responsive:
- ✅ Touch-friendly buttons
- ✅ Responsive layout
- ✅ Mobile-optimized forms
- ✅ Easy scrolling logs
- ✅ Large tap targets

---

## 🐳 Docker Deployment (Alternative)

### Using Docker Compose

```bash
# On your server
cd ~/kite-trading-bot

# Build and run with Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Docker with Systemd

```bash
# Create systemd service for Docker Compose
sudo nano /etc/systemd/system/kite-trading-docker.service
```

Paste:

```ini
[Unit]
Description=Kite Trading Bot Docker
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/kite-trading-bot
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable kite-trading-docker
sudo systemctl start kite-trading-docker
```

---

## 📊 Monitoring

### 1. Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/kite-trading-bot
```

Paste:

```
/home/ubuntu/kite-trading-bot/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

### 2. Monitor with htop

```bash
sudo apt install -y htop
htop
```

### 3. Check Service Status

```bash
# Service status
sudo systemctl status kite-trading-bot

# View logs
sudo journalctl -u kite-trading-bot -f

# Check app logs
tail -f ~/kite-trading-bot/logs/supervisor.log
```

### 4. Setup Alerts (Optional)

**Simple Email Alerts:**

```bash
# Install mailutils
sudo apt install -y mailutils

# Send test email
echo "Trading bot started" | mail -s "Bot Status" your@email.com
```

Add to systemd service:

```ini
[Service]
# ... existing config ...
ExecStartPost=/bin/sh -c 'echo "Trading bot started on $(hostname)" | mail -s "Bot Started" your@email.com'
```

---

## 🔄 Automatic Enctoken Update

### Daily Cron Job

Since enctoken expires daily, automate the update:

```bash
# Create update script
nano ~/update-enctoken.sh
```

Paste:

```bash
#!/bin/bash

# Your Kite credentials
USER_ID="AB1234"
PASSWORD="your_password"

# Get TOTP from Google Authenticator secret
# Install: sudo apt install -y oathtool
TOTP_SECRET="YOUR_2FA_SECRET_KEY"
TOTP=$(oathtool --totp --base32 "$TOTP_SECRET")

# Call API
curl -X POST https://yourdomain.com/api/enctoken/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d "{\"userId\": \"$USER_ID\", \"password\": \"$PASSWORD\", \"totp\": \"$TOTP\"}"

# Log result
echo "[$(date)] Enctoken updated" >> ~/enctoken-updates.log
```

Make executable:

```bash
chmod +x ~/update-enctoken.sh
```

Add to crontab:

```bash
crontab -e

# Add line (runs at 9:00 AM IST daily):
0 9 * * * /home/ubuntu/update-enctoken.sh
```

**⚠️ Security Warning:** Storing credentials in scripts is risky. Use only on secure, private servers.

---

## 🧪 Testing Deployment

### 1. Test Local Access

```bash
curl http://localhost:3000/health
```

### 2. Test Domain Access

```bash
curl https://yourdomain.com/health
```

### 3. Test from Mobile

Open browser on phone:
```
https://yourdomain.com
```

### 4. Test API with Auth

```bash
curl https://yourdomain.com/api/status \
  -H "X-API-Key: your-api-key"
```

---

## 📋 Deployment Checklist

- [ ] Oracle Cloud account created
- [ ] Ubuntu instance running
- [ ] Security list configured (ports 80, 443, 3000)
- [ ] Dependencies installed (Node.js, Nginx, Certbot)
- [ ] Code deployed to server
- [ ] Nginx reverse proxy configured
- [ ] Systemd service created and running
- [ ] Domain registered and DNS configured
- [ ] SSL certificate installed
- [ ] Firewall (UFW) configured
- [ ] API authentication added
- [ ] Mobile access tested
- [ ] Logs rotation configured
- [ ] Monitoring setup
- [ ] Automatic enctoken update (optional)

---

## 🆘 Troubleshooting

### Can't connect to server

```bash
# Check if service is running
sudo systemctl status kite-trading-bot

# Check if port is open
sudo netstat -tulpn | grep 3000

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status
```

### Domain not resolving

```bash
# Check DNS propagation
dig yourdomain.com
nslookup yourdomain.com

# Wait 10-30 minutes for DNS to propagate
```

### SSL certificate issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate
sudo certbot certificates

# Test Nginx config
sudo nginx -t
```

### Service keeps restarting

```bash
# Check logs
sudo journalctl -u kite-trading-bot -n 50

# Check app logs
tail -100 ~/kite-trading-bot/logs/app-error.log

# Check enctoken
cat ~/kite-trading-bot/.env.enctoken
```

---

## 💰 Cost Estimate

### Oracle Cloud Free Tier

**Completely FREE:**
- ✅ VM: $0/month (forever)
- ✅ Network: $0/month (unlimited)
- ✅ Storage: $0/month (200GB)

### Optional Costs

| Item | Cost | Note |
|------|------|------|
| Domain (.com) | $10-15/year | Or use free .tk domain |
| SSL Certificate | $0 | Let's Encrypt (free) |
| Email alerts | $0 | Use Gmail SMTP |

**Total: $0-15/year** 🎉

---

## 🎯 Quick Start Summary

```bash
# 1. Create Oracle Cloud account
# 2. Create Ubuntu instance (4 vCPU, 24GB RAM)
# 3. Configure security list (ports 80, 443, 3000)

# 4. Connect to server
ssh ubuntu@YOUR_IP

# 5. Install dependencies
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx

# 6. Deploy code
mkdir ~/kite-trading-bot && cd ~/kite-trading-bot
# Upload your code here

# 7. Install app dependencies
npm install

# 8. Create enctoken file
echo 'ENCTOKEN="token"' > .env.enctoken

# 9. Setup Nginx
sudo nano /etc/nginx/sites-available/kite-trading-bot
# Paste config from above

# 10. Setup systemd
sudo nano /etc/systemd/system/kite-trading-bot.service
# Paste config from above

# 11. Start service
sudo systemctl enable kite-trading-bot
sudo systemctl start kite-trading-bot

# 12. Setup domain DNS (A record to your IP)

# 13. Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# 14. Access from mobile
https://yourdomain.com
```

---

**Your trading bot is now accessible from anywhere! 🌍📱**

Access it at: `https://yourdomain.com`
