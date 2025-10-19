# Routix v7 Deployment Guide

This guide covers deploying Routix to production across different platforms.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Platforms](#deployment-platforms)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)

## Pre-Deployment Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] Production build successful (`pnpm build`)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Stripe account set up and keys obtained
- [ ] Google API key obtained
- [ ] Email service configured (SendGrid or SMTP)
- [ ] Sentry account created
- [ ] SSL certificate obtained (for HTTPS)
- [ ] Domain name configured
- [ ] Backup strategy in place

## Environment Setup

### Production Environment Variables

Create a `.env.production` file with the following variables:

```env
# Node Environment
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/routix_prod

# Authentication
JWT_SECRET=your-long-random-secret-key-at-least-32-characters
OAUTH_SERVER_URL=https://oauth.routix.app

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Google Generative AI
GOOGLE_API_KEY=your_production_google_api_key

# Email Service (SendGrid Recommended for Production)
SENDGRID_API_KEY=your_sendgrid_production_api_key

# Error Tracking (Sentry)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Application
APP_NAME=Routix
APP_URL=https://routix.app
CORS_ORIGIN=https://routix.app

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_STRIPE_WEBHOOKS=true
ENABLE_ERROR_TRACKING=true
ENABLE_RATE_LIMITING=true
```

### Security Best Practices

1. **Use strong JWT secret** (at least 32 characters, random)
2. **Enable HTTPS** on all endpoints
3. **Use production Stripe keys** (not test keys)
4. **Enable rate limiting** to prevent abuse
5. **Configure CORS** to allow only your domain
6. **Use environment variable management** (never commit secrets)
7. **Enable error tracking** for production monitoring
8. **Set up automated backups** for database

## Database Setup

### PostgreSQL Installation

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Docker
docker run --name routix-db \
  -e POSTGRES_USER=routix \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=routix_prod \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:14
```

### Database Migrations

```bash
# Run migrations
pnpm db:push

# Verify migrations
pnpm db:studio  # Opens Drizzle Studio for inspection
```

### Database Backup

```bash
# Create backup
pg_dump -U routix routix_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U routix routix_prod < backup_file.sql

# Automated daily backups (cron)
0 2 * * * pg_dump -U routix routix_prod > /backups/routix_$(date +\%Y\%m\%d).sql
```

## Deployment Platforms

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend Deployment (Vercel)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select root directory: `client`
   - Build command: `pnpm build`
   - Output directory: `dist`

3. **Set environment variables in Vercel**
   ```
   VITE_API_URL=https://api.routix.app
   VITE_ANALYTICS_ENDPOINT=https://analytics.routix.app
   ```

4. **Deploy**
   - Vercel will automatically deploy on push

#### Backend Deployment (Railway)

1. **Create Railway account** at https://railway.app

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose routix-v7 repository

3. **Configure environment**
   - Add all production environment variables
   - Set root directory to project root

4. **Configure database**
   - Add PostgreSQL plugin
   - Railway will provide DATABASE_URL

5. **Deploy**
   ```bash
   railway up
   ```

### Option 2: AWS (Full Stack)

#### EC2 Setup

```bash
# Launch EC2 instance (Ubuntu 22.04)
# Connect via SSH

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Clone repository
git clone https://github.com/routinnet/routix-v7.git
cd routix-v7

# Install dependencies
pnpm install

# Build application
pnpm build

# Start application
pnpm start
```

#### RDS Database

1. **Create RDS PostgreSQL instance**
   - Engine: PostgreSQL 14
   - Instance class: db.t3.micro (for testing)
   - Storage: 20GB
   - Multi-AZ: Yes (for production)

2. **Configure security group**
   - Allow inbound port 5432 from EC2 security group

3. **Run migrations**
   ```bash
   DATABASE_URL="postgresql://user:password@rds-endpoint:5432/routix" pnpm db:push
   ```

#### Load Balancer & Auto Scaling

```bash
# Create Application Load Balancer
# Configure target group pointing to EC2 instances
# Set up auto-scaling group (2-10 instances)
# Configure CloudFront for CDN
```

### Option 3: Docker Deployment

#### Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_USER: routix
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: routix_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://routix:secure_password@db:5432/routix_prod
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - db
    restart: always

volumes:
  postgres_data:
```

#### Deploy with Docker

```bash
# Build image
docker build -t routix:latest .

# Run container
docker run -d \
  --name routix \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e STRIPE_SECRET_KEY="sk_live_..." \
  routix:latest

# Or use Docker Compose
docker-compose up -d
```

### Option 4: Heroku (Legacy, Easier)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create routix-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-secret"
heroku config:set STRIPE_SECRET_KEY="sk_live_..."

# Deploy
git push heroku main

# Run migrations
heroku run pnpm db:push
```

## Post-Deployment

### Verification Steps

```bash
# Check application health
curl https://routix.app/health

# Verify database connection
curl https://routix.app/api/health/db

# Test Stripe webhook
curl -X POST https://routix.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type": "charge.succeeded"}'

# Check error tracking
# Visit Sentry dashboard and verify events are being received
```

### SSL Certificate

```bash
# Using Let's Encrypt (Certbot)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d routix.app -d www.routix.app
sudo certbot renew --dry-run  # Test auto-renewal
```

### Nginx Configuration

```nginx
upstream routix_backend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name routix.app www.routix.app;

    ssl_certificate /etc/letsencrypt/live/routix.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/routix.app/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to backend
    location / {
        proxy_pass http://routix_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name routix.app www.routix.app;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring & Maintenance

### Application Monitoring

1. **Sentry** - Error tracking
   - Visit https://sentry.io
   - Monitor error rates and patterns
   - Set up alerts for critical errors

2. **Database Monitoring**
   ```bash
   # Check database size
   SELECT pg_size_pretty(pg_database_size('routix_prod'));
   
   # Check slow queries
   SELECT query, calls, mean_time FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;
   ```

3. **Application Logs**
   ```bash
   # View logs
   docker logs routix
   
   # Follow logs
   docker logs -f routix
   ```

### Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_subscriptions_user_id ON subscriptions(userId);
   CREATE INDEX idx_generation_history_user_id ON generationHistory(userId);
   ```

2. **Caching Strategy**
   - Cache reference thumbnails in memory
   - Use Redis for session management
   - Implement CDN for static assets

3. **Query Optimization**
   - Use Drizzle Studio to analyze queries
   - Add pagination for large result sets
   - Use database connection pooling

### Backup & Recovery

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/routix"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U routix routix_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://routix-backups/
```

### Scaling Strategy

1. **Horizontal Scaling**
   - Add more application servers behind load balancer
   - Use auto-scaling groups based on CPU/memory

2. **Database Scaling**
   - Read replicas for read-heavy operations
   - Connection pooling (PgBouncer)
   - Sharding for very large datasets

3. **Caching Layer**
   - Redis for session management
   - Memcached for query results
   - CDN for static assets

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Stripe Webhook Not Working**
```bash
# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Check webhook logs in Stripe dashboard
# Settings > Webhooks > View Events
```

**Email Not Sending**
```bash
# Test email configuration
curl -X POST https://routix.app/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

**High Memory Usage**
```bash
# Check process memory
ps aux | grep node

# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm start
```

## Support

For deployment issues:
1. Check Sentry error logs
2. Review application logs
3. Check database logs
4. Open issue on GitHub
5. Contact support@routix.app

---

**Last Updated:** October 2025

