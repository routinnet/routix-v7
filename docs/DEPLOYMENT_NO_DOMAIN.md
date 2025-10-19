# Routix v7 Deployment Without Domain

Complete guide for deploying Routix on your server using IP address instead of a domain name.

## Table of Contents
1. [Quick Start (IP Only)](#quick-start-ip-only)
2. [Manual Setup](#manual-setup)
3. [Access Methods](#access-methods)
4. [SSL Certificate (Optional)](#ssl-certificate-optional)
5. [Firewall Configuration](#firewall-configuration)

## Quick Start (IP Only)

### Option 1: Using the Modified Setup Script

```bash
# SSH into your server
ssh root@your_server_ip

# Download and run the modified setup script
curl -fsSL https://raw.githubusercontent.com/routinnet/routix-v7/main/scripts/ubuntu-vps-setup.sh | sudo bash -s your_server_ip

# The script will automatically:
# - Install all dependencies
# - Set up PostgreSQL
# - Configure Nginx to work with IP address
# - Start the application on port 3000
```

### Option 2: Manual Setup (Step by Step)

#### 1. Connect to Server

```bash
ssh root@your_server_ip
```

#### 2. Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential libssl-dev nginx postgresql postgresql-contrib
```

#### 3. Install Node.js and pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

#### 4. Clone Repository

```bash
cd /home
sudo git clone https://github.com/routinnet/routix-v7.git
sudo chown -R $USER:$USER routix-v7
cd routix-v7
```

#### 5. Install Dependencies

```bash
pnpm install
```

#### 6. Set Up Database

```bash
# Create PostgreSQL user and database
sudo -u postgres psql <<EOF
CREATE USER routix WITH PASSWORD 'secure_password_123';
CREATE DATABASE routix_prod OWNER routix;
GRANT ALL PRIVILEGES ON DATABASE routix_prod TO routix;
EOF

# Run migrations
export DATABASE_URL="postgresql://routix:secure_password_123@localhost:5432/routix_prod"
pnpm db:push
```

#### 7. Create Environment File

```bash
cat > .env.production <<EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://routix:secure_password_123@localhost:5432/routix_prod
JWT_SECRET=$(openssl rand -base64 32)
OAUTH_SERVER_URL=http://your_server_ip:3000
STRIPE_SECRET_KEY=sk_test_mock_key
GOOGLE_API_KEY=your_key_here
SENDGRID_API_KEY=your_key_here
SENTRY_DSN=your_sentry_dsn
APP_NAME=Routix
APP_URL=http://your_server_ip:3000
CORS_ORIGIN=http://your_server_ip:3000
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_STRIPE_WEBHOOKS=true
ENABLE_ERROR_TRACKING=true
ENABLE_RATE_LIMITING=true
EOF
```

#### 8. Build Application

```bash
pnpm build
```

#### 9. Configure Nginx (IP Only)

```bash
sudo nano /etc/nginx/sites-available/routix
```

Add the following configuration:

```nginx
upstream routix_backend {
    server localhost:3000;
    keepalive 64;
}

# HTTP server (no SSL)
server {
    listen 80;
    listen [::]:80;
    server_name _;

    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    client_max_body_size 50M;

    location / {
        proxy_pass http://routix_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/routix /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 10. Create Systemd Service

```bash
sudo nano /etc/systemd/system/routix.service
```

Add:

```ini
[Unit]
Description=Routix Application
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/routix-v7
EnvironmentFile=/home/routix-v7/.env.production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable routix
sudo systemctl start routix
```

#### 11. Verify Installation

```bash
# Check service status
sudo systemctl status routix

# Check if port 80 is listening
sudo netstat -tlnp | grep :80

# Test the application
curl http://your_server_ip
```

## Access Methods

### 1. Direct IP Address

```
http://your_server_ip
http://your_server_ip:80
```

### 2. IP with Custom Port (if not using Nginx)

```
http://your_server_ip:3000
```

### 3. Using SSH Tunnel (Local Access)

```bash
ssh -L 8080:localhost:80 root@your_server_ip
# Then access: http://localhost:8080
```

### 4. Using Server Hostname (if available)

```bash
# Check hostname
hostname -I

# Use in browser
http://your_server_hostname
```

## SSL Certificate (Optional)

### Option 1: Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/routix-self.key \
  -out /etc/ssl/certs/routix-self.crt

# Update Nginx configuration to use SSL
sudo nano /etc/nginx/sites-available/routix
```

Add HTTPS section:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;

    ssl_certificate /etc/ssl/certs/routix-self.crt;
    ssl_certificate_key /etc/ssl/private/routix-self.key;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name _;
    return 301 https://$server_addr$request_uri;
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Access via HTTPS:

```
https://your_server_ip
# Browser will show certificate warning (normal for self-signed)
```

### Option 2: Let's Encrypt with Certbot (Requires Domain)

If you later add a domain, use:

```bash
sudo certbot certonly --nginx -d your-domain.com
```

## Firewall Configuration

### UFW (Ubuntu Firewall)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (if using SSL)
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### iptables

```bash
# Allow HTTP
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Allow HTTPS
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Save rules
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

## Monitoring & Logs

### View Application Logs

```bash
# Real-time logs
sudo journalctl -u routix -f

# Last 100 lines
sudo journalctl -u routix -n 100

# Specific time range
sudo journalctl -u routix --since "2 hours ago"
```

### View Nginx Logs

```bash
# Error logs
sudo tail -f /var/log/nginx/error.log

# Access logs
sudo tail -f /var/log/nginx/access.log
```

### Check Service Status

```bash
# Routix service
sudo systemctl status routix

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
```

## Troubleshooting

### Application Not Accessible

```bash
# Check if service is running
sudo systemctl status routix

# Check if port 80 is listening
sudo netstat -tlnp | grep :80

# Check Nginx configuration
sudo nginx -t

# Restart services
sudo systemctl restart nginx
sudo systemctl restart routix
```

### Database Connection Error

```bash
# Test database connection
psql -U routix -d routix_prod -c "SELECT 1"

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Find memory-hungry processes
ps aux --sort=-%mem | head -10

# Increase Node memory limit
# Edit /etc/systemd/system/routix.service
# Add: Environment="NODE_OPTIONS=--max-old-space-size=4096"
```

### Port Already in Use

```bash
# Find process using port 80
sudo lsof -i :80

# Find process using port 3000
sudo lsof -i :3000

# Kill process (if needed)
sudo kill -9 <PID>
```

## Performance Optimization

### Enable Caching

```bash
# Install Redis
sudo apt-get install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
```

### Database Optimization

```bash
# Connect to database
psql -U routix -d routix_prod

# Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(userId);
CREATE INDEX idx_generation_history_user_id ON generationHistory(userId);

# Analyze
ANALYZE;

# Exit
\q
```

### Nginx Optimization

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/nginx.conf

# Increase worker connections
worker_connections 2048;

# Enable keepalive
keepalive_timeout 65;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Backup & Recovery

### Create Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Database backup
pg_dump -U routix routix_prod | gzip > ~/backups/db_$(date +%Y%m%d_%H%M%S).sql.gz

# Application backup
tar -czf ~/backups/app_$(date +%Y%m%d_%H%M%S).tar.gz /home/routix-v7 \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist
```

### Restore Backup

```bash
# Restore database
gunzip < ~/backups/db_backup.sql.gz | psql -U routix routix_prod

# Restore application
tar -xzf ~/backups/app_backup.tar.gz -C /
```

### Automated Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add (daily backup at 2 AM)
0 2 * * * pg_dump -U routix routix_prod | gzip > ~/backups/db_$(date +\%Y\%m\%d).sql.gz

# Verify
crontab -l
```

## Security Hardening

### Fail2Ban

```bash
# Install
sudo apt-get install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

### SSH Security

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Reload SSH
sudo systemctl reload sshd
```

## Accessing from Different Machines

### From Local Network

```bash
# Find server IP
ip addr show

# Access from another machine on same network
http://192.168.1.100  # Replace with your server IP
```

### From Internet (Port Forwarding)

1. Log into your router
2. Set up port forwarding:
   - External Port: 80 (or 8080)
   - Internal IP: your_server_ip
   - Internal Port: 80
3. Access via: `http://your_public_ip`

### Using ngrok (Temporary Public URL)

```bash
# Install ngrok
curl https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Expose application
ngrok http 80

# You'll get a public URL like: https://abc123.ngrok.io
```

## Next Steps

1. **Add a Domain** (Optional)
   - Update DNS records to point to your server IP
   - Use Certbot for free SSL certificate

2. **Configure Email**
   - Set up SendGrid or SMTP credentials
   - Update `.env.production`

3. **Add Stripe Keys**
   - Get from https://dashboard.stripe.com
   - Update `.env.production`

4. **Set Up Monitoring**
   - Configure Sentry for error tracking
   - Set up log aggregation

5. **Enable Backups**
   - Set up automated database backups
   - Test restore procedures

## Support

For issues:
1. Check logs: `sudo journalctl -u routix -f`
2. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Open issue on GitHub
4. Contact support@routix.app

---

**Last Updated:** October 2025

