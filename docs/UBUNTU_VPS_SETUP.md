# Routix v7 Ubuntu VPS Deployment Guide

Complete step-by-step guide for deploying Routix on Ubuntu VPS (20.04, 22.04, 24.04).

## Table of Contents
1. [Initial VPS Setup](#initial-vps-setup)
2. [System Dependencies](#system-dependencies)
3. [Application Setup](#application-setup)
4. [Database Setup](#database-setup)
5. [Web Server Configuration](#web-server-configuration)
6. [SSL Certificate](#ssl-certificate)
7. [Process Management](#process-management)
8. [Monitoring & Logs](#monitoring--logs)
9. [Backup Strategy](#backup-strategy)
10. [Troubleshooting](#troubleshooting)

## Initial VPS Setup

### 1. Connect to VPS

```bash
# SSH into your VPS
ssh root@your_vps_ip

# Or with specific key
ssh -i /path/to/key.pem root@your_vps_ip
```

### 2. Update System

```bash
# Update package manager
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y \
  curl \
  wget \
  git \
  build-essential \
  libssl-dev \
  libffi-dev \
  python3-dev \
  supervisor \
  nginx \
  certbot \
  python3-certbot-nginx
```

### 3. Create Application User

```bash
# Create non-root user for application
sudo useradd -m -s /bin/bash routix
sudo usermod -aG sudo routix

# Switch to new user
su - routix

# Generate SSH key (optional)
ssh-keygen -t ed25519 -C "routix@your-domain.com"
```

### 4. Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow PostgreSQL (if local)
sudo ufw allow 5432/tcp

# Check status
sudo ufw status
```

## System Dependencies

### 1. Install Node.js

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### 3. Install PostgreSQL

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### 4. Install Redis (Optional but Recommended)

```bash
# Install Redis
sudo apt-get install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify installation
redis-cli ping
# Should return: PONG
```

## Application Setup

### 1. Clone Repository

```bash
# Clone repository
cd /home/routix
git clone https://github.com/routinnet/routix-v7.git
cd routix-v7

# Set proper permissions
sudo chown -R routix:routix /home/routix/routix-v7
```

### 2. Install Dependencies

```bash
# Install dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

### 3. Configure Environment

```bash
# Create .env.production file
nano .env.production

# Add the following (see DEPLOYMENT.md for full list):
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://routix:password@localhost:5432/routix_prod
JWT_SECRET=your-long-random-secret-key-at-least-32-characters
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
GOOGLE_API_KEY=your_api_key
SENDGRID_API_KEY=your_sendgrid_key
SENTRY_DSN=your_sentry_dsn
APP_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### 4. Build Application

```bash
# Build frontend and backend
pnpm build

# Verify build
ls -la dist/
```

## Database Setup

### 1. Create Database User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create user
CREATE USER routix WITH PASSWORD 'secure_password';

# Create database
CREATE DATABASE routix_prod OWNER routix;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE routix_prod TO routix;

# Exit psql
\q
```

### 2. Run Migrations

```bash
# Set database URL
export DATABASE_URL="postgresql://routix:secure_password@localhost:5432/routix_prod"

# Run migrations
pnpm db:push

# Verify database
psql $DATABASE_URL -c "\dt"
```

### 3. Create Backup Directory

```bash
# Create backup directory
sudo mkdir -p /var/backups/routix
sudo chown routix:routix /var/backups/routix
chmod 700 /var/backups/routix
```

## Web Server Configuration

### 1. Install and Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/routix

# Add the following configuration:
```

```nginx
upstream routix_backend {
    server localhost:3000;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (will be set by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Client max body size (for file uploads)
    client_max_body_size 50M;

    # Proxy settings
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

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/routix /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## SSL Certificate

### 1. Install SSL Certificate with Certbot

```bash
# Install certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts and agree to terms

# Verify certificate
sudo certbot certificates
```

### 2. Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check renewal status
sudo systemctl status certbot.timer
```

## Process Management

### 1. Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/routix.service

# Add the following:
```

```ini
[Unit]
Description=Routix Application
After=network.target postgresql.service

[Service]
Type=simple
User=routix
WorkingDirectory=/home/routix/routix-v7
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/home/routix/routix-v7/.env.production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable routix

# Start service
sudo systemctl start routix

# Check status
sudo systemctl status routix

# View logs
sudo journalctl -u routix -f
```

### 2. Alternative: Supervisor

```bash
# Create supervisor configuration
sudo nano /etc/supervisor/conf.d/routix.conf

# Add the following:
```

```ini
[program:routix]
directory=/home/routix/routix-v7
command=/usr/bin/pnpm start
user=routix
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/routix/routix.log
environment=NODE_ENV=production,PORT=3000
```

```bash
# Create log directory
sudo mkdir -p /var/log/routix
sudo chown routix:routix /var/log/routix

# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Start application
sudo supervisorctl start routix

# Check status
sudo supervisorctl status routix
```

## Monitoring & Logs

### 1. View Application Logs

```bash
# Using systemd
sudo journalctl -u routix -f

# Using supervisor
tail -f /var/log/routix/routix.log

# View last 100 lines
sudo journalctl -u routix -n 100
```

### 2. Monitor System Resources

```bash
# Install htop
sudo apt-get install -y htop

# Monitor in real-time
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### 3. Database Monitoring

```bash
# Connect to database
psql -U routix -d routix_prod

# Check database size
SELECT pg_size_pretty(pg_database_size('routix_prod'));

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

# Exit
\q
```

## Backup Strategy

### 1. Create Backup Script

```bash
# Create backup script
nano /home/routix/backup.sh

# Add the following:
```

```bash
#!/bin/bash

# Backup configuration
BACKUP_DIR="/var/backups/routix"
DB_NAME="routix_prod"
DB_USER="routix"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "Backing up database..."
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application files backup (optional)
echo "Backing up application files..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/routix/routix-v7 \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist

# Clean old backups
echo "Cleaning old backups..."
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully!"

# Optional: Upload to cloud storage
# aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://your-bucket/backups/
```

```bash
# Make executable
chmod +x /home/routix/backup.sh

# Test backup
/home/routix/backup.sh
```

### 2. Schedule Automated Backups

```bash
# Edit crontab
crontab -e

# Add the following (daily backup at 2 AM):
0 2 * * * /home/routix/backup.sh >> /var/log/routix/backup.log 2>&1

# Verify cron job
crontab -l
```

## Troubleshooting

### Application Won't Start

```bash
# Check service status
sudo systemctl status routix

# View detailed logs
sudo journalctl -u routix -n 50

# Check if port is in use
sudo lsof -i :3000

# Kill process on port 3000
sudo kill -9 $(lsof -t -i:3000)

# Restart service
sudo systemctl restart routix
```

### Database Connection Error

```bash
# Test database connection
psql -U routix -d routix_prod -c "SELECT 1"

# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx Not Working

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart Nginx
sudo systemctl restart nginx
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Find memory-hungry processes
ps aux --sort=-%mem | head -10

# Increase Node.js memory limit
# Edit /etc/systemd/system/routix.service
# Add: Environment="NODE_OPTIONS=--max-old-space-size=4096"
```

### SSL Certificate Issues

```bash
# Check certificate validity
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Check certificate expiration
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Performance Optimization

### 1. Enable Caching

```bash
# Install Redis (if not already done)
sudo apt-get install -y redis-server

# Enable Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2. Database Optimization

```bash
# Connect to database
psql -U routix -d routix_prod

# Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(userId);
CREATE INDEX idx_generation_history_user_id ON generationHistory(userId);

# Analyze database
ANALYZE;

# Exit
\q
```

### 3. Nginx Optimization

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

## Security Hardening

### 1. Fail2Ban Installation

```bash
# Install Fail2Ban
sudo apt-get install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

### 2. SSH Security

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Change default port (optional)
Port 2222

# Disable root login
PermitRootLogin no

# Disable password authentication (use keys only)
PasswordAuthentication no

# Reload SSH
sudo systemctl reload sshd
```

### 3. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp  # PostgreSQL (only if needed)
sudo ufw enable
```

## Maintenance Tasks

### Daily
- Monitor application logs
- Check disk space
- Monitor memory usage

### Weekly
- Review error logs
- Check database size
- Verify backups

### Monthly
- Update system packages
- Review security logs
- Optimize database

### Quarterly
- Full system backup
- Security audit
- Performance review

## Support

For issues:
1. Check application logs: `sudo journalctl -u routix -f`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check database logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
4. Open issue on GitHub
5. Contact support@routix.app

---

**Last Updated:** October 2025

