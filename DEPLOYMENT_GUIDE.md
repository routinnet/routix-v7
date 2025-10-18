# Routix Deployment Guide

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0+
- Redis 6.0+
- Stripe account
- OpenAI API key
- AWS S3 bucket

## Environment Variables
```
DATABASE_URL=mysql://user:pass@host:3306/routix
JWT_SECRET=your-secret-key
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=routix-thumbnails
REDIS_URL=redis://localhost:6379
```

## Docker Deployment
```bash
docker-compose up -d
```

## Database Setup
```bash
pnpm db:push
pnpm db:seed
```

## Running Locally
```bash
pnpm install
pnpm dev
```

## Production Deployment
1. Build: `pnpm build`
2. Start: `pnpm start`
3. Monitor: Use PM2 or systemd

## Health Checks
- GET `/health` - Server status
- GET `/health/db` - Database connection
- GET `/health/redis` - Redis connection

## Monitoring
- Use Sentry for error tracking
- Use DataDog for performance monitoring
- Use CloudWatch for AWS resources
