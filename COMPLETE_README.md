# Routix - AI-Powered Thumbnail Generation Platform

## 🎯 Overview
Routix is a cutting-edge AI platform that generates professional thumbnails through conversational AI. Users describe what they want, and AI creates beautiful, optimized thumbnails instantly.

## ✨ Features

### Core Features
- **ChatGPT-Style Interface** - Intuitive conversation-based generation
- **Multiple AI Models** - Open Routix v1, v2, Gemini Vision
- **Advanced Settings** - Quality levels, styles, and sizes
- **File Upload** - Reference images for better generation
- **Real-time Generation** - Instant thumbnail creation
- **Download & Share** - Export and share with team

### Advanced Features
- **Model Selection** - Choose between 3 AI models
- **Quality Levels** - Draft, Standard, Premium options
- **8 Style Presets** - Professional, YouTube, Social Media, etc.
- **4 Resolution Options** - HD, Full HD, 2K, Square
- **Conversation History** - Access all past chats
- **Batch Processing** - Generate multiple variations
- **Template Library** - Pre-designed professional templates
- **Admin Dashboard** - User management and analytics

### User Features
- **Credit System** - Free/Pro/Enterprise tiers
- **Billing Dashboard** - Purchase and manage credits
- **User Settings** - Preferences and API keys
- **Profile Management** - Account customization
- **Search** - Find past conversations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

### Installation
```bash
git clone https://github.com/routix/routix.git
cd routix
pnpm install
pnpm db:push
pnpm dev
```

### Access
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/trpc

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [User Manual](./USER_MANUAL.md)
- [Admin Guide](./ADMIN_GUIDE.md)

## 🏗️ Architecture

### Frontend
- React 19 + Tailwind CSS 4
- tRPC for type-safe API calls
- Glassmorphism design
- Luxury fonts (Playfair Display)

### Backend
- Express.js + tRPC
- MySQL with Drizzle ORM
- Redis for caching
- Stripe for payments
- OpenAI for image generation

### Database
- Users & Authentication
- Conversations & Messages
- Thumbnails & Templates
- Credit Transactions
- Analytics

## 🔒 Security

- OAuth 2.0 authentication
- Rate limiting (100 req/min)
- Input validation
- CORS protection
- Security headers
- Encrypted sessions

## 💳 Pricing

- **Free**: 50 credits/month
- **Pro**: 500 credits/month ($9.99)
- **Enterprise**: Unlimited (custom)

## 📊 Analytics

- User metrics
- Generation statistics
- Revenue tracking
- API usage monitoring
- Performance metrics

## 🛠️ Development

### Available Scripts
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm db:push      # Push database schema
pnpm test         # Run tests
pnpm lint         # Lint code
```

### Project Structure
```
routix/
├── client/           # React frontend
├── server/           # Express backend
├── drizzle/          # Database schema
├── storage/          # S3 integration
└── shared/           # Shared types
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

MIT License - see LICENSE file

## 🆘 Support

- Email: support@routix.app
- Chat: In-app support
- Docs: https://docs.routix.app

## 🎉 Acknowledgments

Built with ❤️ using React, Express, and AI

---

**Routix v1.0** - Making thumbnail creation effortless
