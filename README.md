# Routix v7 - AI-Powered YouTube Thumbnail Generator

![Routix](https://img.shields.io/badge/Routix-v7-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)

Routix is a cutting-edge AI-powered platform that generates viral-quality YouTube thumbnails using advanced machine learning, reference-based design patterns, and professional post-production techniques.

## 🌟 Features

### Core Generation System
- **8-Step AI Orchestrator** - Sophisticated workflow from user input to final image delivery
- **Reference Thumbnail Database** - 90+ professionally designed viral templates
- **Gemini Vision Integration** - Advanced image analysis and metadata extraction
- **DALL-E 3 Integration** - State-of-the-art image generation
- **Advanced Prompt Engineering** - Optimized prompts for maximum quality
- **Post-Production Effects** - Vignette, grain, contrast enhancement
- **Quality Validation** - Automated quality scoring and improvement recommendations

### Monetization & Billing
- **Stripe Integration** - Complete payment processing
- **Subscription Plans** - Free, Pro, and Enterprise tiers
- **Credit System** - Pay-per-generation model
- **Coupon Management** - Discount codes and promotional campaigns
- **Referral Program** - User acquisition through referrals
- **Invoice Generation** - Automated billing and invoicing
- **Tax Calculation** - Location-based tax support

### Admin Dashboard
- **Analytics Dashboard** - Real-time metrics and KPIs
- **User Management** - Complete user administration
- **Transaction Monitoring** - Payment and credit tracking
- **Plan Management** - Dynamic pricing and plan configuration
- **Coupon Management** - Create and manage promotional codes
- **Revenue Analytics** - Detailed financial reporting

### Chat-First Interface
- **Real-Time Chat** - Conversational AI interaction
- **Generation Preview** - 8-step progress visualization
- **History Sidebar** - Access to all generated thumbnails
- **Quality Feedback** - User ratings and preferences
- **Download & Share** - Easy export and social sharing

## 🚀 Quick Start

### Prerequisites
- Node.js 22.13.0+
- pnpm 9.0+
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/routinnet/routix-v7.git
cd routix-v7

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Node Environment
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/routix

# Authentication
JWT_SECRET=your-secret-key-at-least-32-characters-long
OAUTH_SERVER_URL=http://localhost:3001

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Generative AI
GOOGLE_API_KEY=your_google_api_key

# Email Service (Choose one)
# Option 1: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@routix.app

# Option 2: SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# Error Tracking
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=development

# Application
APP_NAME=Routix
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_STRIPE_WEBHOOKS=true
ENABLE_ERROR_TRACKING=true
ENABLE_RATE_LIMITING=true
```

## 📁 Project Structure

```
routix-v7/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── styles/        # Global styles
│   └── vite.config.ts
├── server/                # Backend API
│   ├── routers.ts         # tRPC router definitions
│   ├── config.ts          # Configuration management
│   ├── ai-orchestrator.service.ts    # 8-step generation flow
│   ├── stripe.service.ts  # Stripe integration
│   ├── email.service.ts   # Email notifications
│   ├── monitoring.ts      # Error tracking
│   └── __tests__/         # Test suites
├── drizzle/               # Database schema
│   ├── schema.ts          # Table definitions
│   └── migrations/        # Database migrations
├── docs/                  # Documentation
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── API.md             # API documentation
│   └── AI_GENERATION_SYSTEM.md
└── package.json
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, tRPC, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **AI/ML**: Google Generative AI, DALL-E 3
- **Payments**: Stripe
- **Email**: Nodemailer/SendGrid
- **Monitoring**: Sentry
- **Testing**: Vitest

### Core Services

#### AI Orchestrator (8-Step Flow)
1. **User Request Validation** - Normalize and validate input
2. **AI Analysis** - Extract metadata using Gemini Vision
3. **Reference Selection** - Find best-matching template
4. **Prompt Engineering** - Optimize for DALL-E 3
5. **Image Generation** - Create thumbnail using DALL-E
6. **Post-Production** - Apply effects and validate quality
7. **Delivery & Logging** - Store and deliver to user
8. **Summary** - Log metrics and analytics

#### Payment Processing
- Stripe checkout sessions for credits and subscriptions
- Webhook handling for payment confirmations
- Automatic credit updates on successful payment
- Invoice generation and email delivery

#### Email Notifications
- Payment confirmations
- Invoice delivery
- Referral bonuses
- Subscription renewals
- System alerts

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- server/__tests__/generation.test.ts

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

**Test Coverage:**
- 94 tests passing
- 3 skipped (require API keys)
- 0 failures
- Unit tests for all core services
- Integration tests for critical flows
- E2E tests for production readiness

## 📊 Database Schema

### Core Tables
- **users** - User accounts and profiles
- **subscriptions** - User subscription plans
- **subscriptionPlans** - Available plans
- **creditTransactions** - Credit purchases and usage
- **invoices** - Generated invoices
- **coupons** - Discount codes
- **referralCodes** - Referral program codes
- **referenceThumbnails** - Template database
- **thumbnailMetadata** - Extracted template metadata
- **generationHistory** - Generated image history
- **topicPreferences** - Topic-to-template mappings

## 🔐 Security

- JWT-based authentication
- Stripe webhook signature verification
- Environment variable validation with Zod
- SQL injection prevention via Drizzle ORM
- CORS configuration
- Rate limiting support
- Error tracking with Sentry

## 📈 Performance

- Optimized database queries with Drizzle ORM
- Caching-ready architecture
- Lazy loading for images
- Efficient state management
- Production build: 871KB optimized

## 🚢 Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options
- **Vercel** - Frontend hosting
- **Railway** - Backend and database
- **AWS** - Full-stack deployment
- **Docker** - Containerized deployment

## 📚 Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md)
- [API Documentation](./docs/API.md)
- [AI Generation System](./docs/AI_GENERATION_SYSTEM.md)
- [Billing Features](./docs/billing_features_documentation.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@routix.app or open an issue on GitHub.

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core AI generation system
- ✅ Billing and monetization
- ✅ Admin dashboard
- ✅ Email notifications

### Phase 2 (Upcoming)
- [ ] Mobile app (React Native)
- [ ] Batch generation
- [ ] Template marketplace
- [ ] Advanced analytics
- [ ] Team collaboration

### Phase 3 (Future)
- [ ] API for third-party integrations
- [ ] Custom model fine-tuning
- [ ] Real-time collaboration
- [ ] Advanced scheduling

## 📞 Contact

- **Website**: https://routix.app
- **Email**: hello@routix.app
- **Twitter**: @routix_app
- **Discord**: [Join our community](https://discord.gg/routix)

---

**Made with ❤️ by the Routix Team**

Last Updated: October 2025

