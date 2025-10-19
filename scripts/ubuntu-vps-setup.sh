#!/bin/bash

#############################################
# Routix v7 Ubuntu VPS Automated Setup
# Supports: Ubuntu 20.04, 22.04, 24.04
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"your-domain.com"}
APP_USER="routix"
APP_DIR="/home/routix/routix-v7"
DB_NAME="routix_prod"
DB_USER="routix"
DB_PASSWORD=$(openssl rand -base64 32)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Routix v7 Ubuntu VPS Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# Function to print section headers
print_section() {
    echo -e "${BLUE}>>> $1${NC}"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ============================================
# 1. System Update
# ============================================
print_section "Updating System"
apt-get update
apt-get upgrade -y
print_success "System updated"

# ============================================
# 2. Install Essential Tools
# ============================================
print_section "Installing Essential Tools"
apt-get install -y \
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
    python3-certbot-nginx \
    htop \
    net-tools \
    ufw \
    fail2ban
print_success "Essential tools installed"

# ============================================
# 3. Configure Firewall
# ============================================
print_section "Configuring Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp
echo "y" | ufw enable
print_success "Firewall configured"

# ============================================
# 4. Create Application User
# ============================================
print_section "Creating Application User"
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER
    usermod -aG sudo $APP_USER
    print_success "User $APP_USER created"
else
    print_warning "User $APP_USER already exists"
fi

# ============================================
# 5. Install Node.js
# ============================================
print_section "Installing Node.js"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
print_success "Node.js installed: $(node --version)"

# ============================================
# 6. Install pnpm
# ============================================
print_section "Installing pnpm"
npm install -g pnpm
print_success "pnpm installed: $(pnpm --version)"

# ============================================
# 7. Install PostgreSQL
# ============================================
print_section "Installing PostgreSQL"
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
print_success "PostgreSQL installed: $(psql --version)"

# ============================================
# 8. Install Redis
# ============================================
print_section "Installing Redis"
apt-get install -y redis-server
systemctl start redis-server
systemctl enable redis-server
print_success "Redis installed"

# ============================================
# 9. Create Database
# ============================================
print_section "Creating Database"
sudo -u postgres psql <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
print_success "Database created: $DB_NAME"
echo -e "${YELLOW}Database Password: $DB_PASSWORD${NC}"

# ============================================
# 10. Clone Repository
# ============================================
print_section "Cloning Repository"
mkdir -p /home/$APP_USER
cd /home/$APP_USER
if [ ! -d "routix-v7" ]; then
    sudo -u $APP_USER git clone https://github.com/routinnet/routix-v7.git
    print_success "Repository cloned"
else
    print_warning "Repository already exists"
fi
chown -R $APP_USER:$APP_USER /home/$APP_USER/routix-v7

# ============================================
# 11. Install Dependencies
# ============================================
print_section "Installing Application Dependencies"
cd $APP_DIR
sudo -u $APP_USER pnpm install
print_success "Dependencies installed"

# ============================================
# 12. Create Environment File
# ============================================
print_section "Creating Environment Configuration"
cat > $APP_DIR/.env.production <<EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Authentication
JWT_SECRET=$(openssl rand -base64 32)
OAUTH_SERVER_URL=https://$DOMAIN

# Stripe (Add your keys)
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google API
GOOGLE_API_KEY=your_google_api_key_here

# Email Service (SendGrid recommended)
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Error Tracking (Sentry)
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=production

# Application
APP_NAME=Routix
APP_URL=https://$DOMAIN
CORS_ORIGIN=https://$DOMAIN

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_STRIPE_WEBHOOKS=true
ENABLE_ERROR_TRACKING=true
ENABLE_RATE_LIMITING=true
EOF
chown $APP_USER:$APP_USER $APP_DIR/.env.production
chmod 600 $APP_DIR/.env.production
print_success "Environment file created"

# ============================================
# 13. Build Application
# ============================================
print_section "Building Application"
cd $APP_DIR
sudo -u $APP_USER pnpm build
print_success "Application built"

# ============================================
# 14. Run Database Migrations
# ============================================
print_section "Running Database Migrations"
cd $APP_DIR
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
sudo -u $APP_USER pnpm db:push
print_success "Database migrations completed"

# ============================================
# 15. Create Systemd Service
# ============================================
print_section "Creating Systemd Service"
cat > /etc/systemd/system/routix.service <<EOF
[Unit]
Description=Routix Application
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env.production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable routix
print_success "Systemd service created"

# ============================================
# 16. Configure Nginx
# ============================================
print_section "Configuring Nginx"
cat > /etc/nginx/sites-available/routix <<'NGINX_CONFIG'
upstream routix_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

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
NGINX_CONFIG

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/routix

# Enable site
ln -sf /etc/nginx/sites-available/routix /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx
nginx -t
systemctl start nginx
systemctl enable nginx
print_success "Nginx configured"

# ============================================
# 17. Install SSL Certificate
# ============================================
print_section "Installing SSL Certificate"
certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
systemctl reload nginx
print_success "SSL certificate installed"

# ============================================
# 18. Create Backup Script
# ============================================
print_section "Creating Backup Script"
mkdir -p /var/backups/routix
chown $APP_USER:$APP_USER /var/backups/routix

cat > /home/$APP_USER/backup.sh <<'BACKUP_SCRIPT'
#!/bin/bash
BACKUP_DIR="/var/backups/routix"
DB_NAME="routix_prod"
DB_USER="routix"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
BACKUP_SCRIPT

chmod +x /home/$APP_USER/backup.sh
chown $APP_USER:$APP_USER /home/$APP_USER/backup.sh

# Add to crontab
(crontab -u $APP_USER -l 2>/dev/null; echo "0 2 * * * /home/$APP_USER/backup.sh >> /var/log/routix/backup.log 2>&1") | crontab -u $APP_USER -
print_success "Backup script created and scheduled"

# ============================================
# 19. Create Log Directory
# ============================================
print_section "Creating Log Directory"
mkdir -p /var/log/routix
chown $APP_USER:$APP_USER /var/log/routix
print_success "Log directory created"

# ============================================
# 20. Start Application
# ============================================
print_section "Starting Application"
systemctl start routix
sleep 3
if systemctl is-active --quiet routix; then
    print_success "Application started successfully"
else
    print_error "Failed to start application"
    systemctl status routix
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Setup Completed Successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Important Information:${NC}"
echo "Domain: $DOMAIN"
echo "Database: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASSWORD"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Edit environment variables:"
echo "   nano $APP_DIR/.env.production"
echo "   Add your Stripe, Google API, and SendGrid keys"
echo ""
echo "2. Restart application:"
echo "   systemctl restart routix"
echo ""
echo "3. View logs:"
echo "   journalctl -u routix -f"
echo ""
echo "4. Access application:"
echo "   https://$DOMAIN"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "systemctl status routix          - Check application status"
echo "systemctl restart routix         - Restart application"
echo "journalctl -u routix -f          - View live logs"
echo "psql -U $DB_USER -d $DB_NAME    - Connect to database"
echo "nginx -t                         - Test Nginx configuration"
echo "certbot renew --dry-run          - Test SSL renewal"
echo ""
echo -e "${BLUE}========================================${NC}"

