# Routix API Documentation

## Overview
Routix is an AI-powered thumbnail generation platform with a tRPC-based API.

## Authentication
All endpoints require authentication via Manus OAuth. Session is maintained via HTTP-only cookies.

## Base URL
```
https://api.routix.app/api/trpc
```

## Core Endpoints

### Authentication
- `auth.me` - Get current user
- `auth.logout` - Logout user

### Conversations
- `conversation.create` - Create new conversation
- `conversation.list` - List user conversations
- `conversation.delete` - Delete conversation
- `conversation.search` - Search conversations

### Chat
- `chat.sendMessage` - Send message and generate thumbnail
- `chat.getHistory` - Get conversation history
- `chat.regenerate` - Regenerate thumbnail

### Thumbnails
- `thumbnail.list` - List user thumbnails
- `thumbnail.download` - Download thumbnail
- `thumbnail.share` - Share thumbnail
- `thumbnail.delete` - Delete thumbnail

### User
- `user.getProfile` - Get user profile
- `user.updateProfile` - Update user profile
- `user.getCreditHistory` - Get credit transactions

### Billing
- `payment.buyCredits` - Purchase credits
- `payment.getPlans` - Get subscription plans
- `payment.webhook` - Stripe webhook handler

### Admin
- `admin.getAnalytics` - Get platform analytics
- `admin.getAllUsers` - List all users
- `admin.updateUserRole` - Update user role

## Error Handling
All errors return standard tRPC error format with code and message.

## Rate Limiting
- 100 requests per minute per user
- 10 thumbnail generations per minute per user

## Response Format
All responses use SuperJSON for proper Date/BigInt serialization.
