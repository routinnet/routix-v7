#!/bin/bash

# Routix v7 - Quick Start (No Domain Required)
# Usage: sudo bash quick-start-no-domain.sh

set -e

echo "🚀 Routix v7 - Quick Start Installation"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo "❌ This script must be run as root"
   exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "📍 Server IP: $SERVER_IP"

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y curl wget git build-essential libssl-dev nginx postgresql postgresql-contrib

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pnpm

# Clone repository
echo "📦 Cloning Routix repository..."
cd /home
if [ ! -d "routix-v7" ]; then
    git clone https://github.com/routinnet/routix-v7.git
fi
cd routix-v7

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup database
echo "📦 Setting up PostgreSQL..."
sudo -u postgres psql <<PSQL
CREATE USER routix WITH PASSWORD 'routix_secure_123';
CREATE DATABASE routix_prod OWNER routix;
GRANT ALL PRIVILEGES ON DATABASE routix_prod TO routix;
PSQL

# Create environment file
echo "📝 Creating environment configuration..."
cat > .env.production <<ENV
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://routix:routix_secure_123@localhost:5432/routix_prod
JWT_SECRET=$(openssl rand -base64 32)
OAUTH_SERVER_URL=http://$SERVER_IP
STRIPE_SECRET_KEY=sk_test_mock_key
GOOGLE_API_KEY=your_google_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENTRY_DSN=
APP_NAME=Routix
APP_URL=http://$SERVER_IP
CORS_ORIGIN=http://$SERVER_IP
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_STRIPE_WEBHOOKS=true
ENABLE_ERROR_TRACKING=true
ENABLE_RATE_LIMITING=true
ENV

# Run migrations
echo "🗄️  Running database migrations..."
export DATABASE_URL="postgresql://routix:routix_secure_123@localhost:5432/routix_prod"
pnpm db:push

# Build application
echo "🔨 Building application..."
pnpm build

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/routix <<NGINX
upstream routix_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    client_max_body_size 50M;

    location / {
        proxy_pass http://routix_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/routix /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Create systemd service
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/routix.service <<SERVICE
[Unit]
Description=Routix Application
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/routix-v7
EnvironmentFile=/home/routix-v7/.env.production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable routix
systemctl start routix

# Configure firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 5

# Check status
echo ""
echo "✅ Installation Complete!"
echo "========================================"
echo "🌐 Access your application at:"
echo "   http://$SERVER_IP"
echo ""
echo "📊 View logs:"
echo "   sudo journalctl -u routix -f"
echo ""
echo "🔧 Manage service:"
echo "   sudo systemctl status routix"
echo "   sudo systemctl restart routix"
echo ""
echo "📝 Configuration file:"
echo "   /home/routix-v7/.env.production"
echo ""
echo "🗄️  Database:"
echo "   User: routix"
echo "   Password: routix_secure_123"
echo "   Database: routix_prod"
echo ""
echo "⚠️  Important: Update API keys in .env.production"
echo "========================================"
