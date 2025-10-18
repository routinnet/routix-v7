# Routix API Documentation (Swagger/OpenAPI)

## Base URL
```
https://api.routix.app/api
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer {JWT_TOKEN}
```

## Endpoints

### Authentication
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Conversations
- `GET /conversations` - List conversations
- `POST /conversations` - Create conversation
- `GET /conversations/{id}` - Get conversation
- `DELETE /conversations/{id}` - Delete conversation
- `GET /conversations/search` - Search conversations

### Chat Messages
- `POST /conversations/{id}/messages` - Send message
- `GET /conversations/{id}/messages` - Get messages
- `POST /conversations/{id}/messages/{msgId}/regenerate` - Regenerate thumbnail

### Thumbnails
- `GET /thumbnails` - List thumbnails
- `GET /thumbnails/{id}` - Get thumbnail
- `POST /thumbnails/{id}/download` - Download thumbnail
- `POST /thumbnails/{id}/share` - Share thumbnail
- `DELETE /thumbnails/{id}` - Delete thumbnail

### Templates
- `GET /templates` - List templates
- `GET /templates/{id}` - Get template
- `POST /templates` - Create template
- `PUT /templates/{id}` - Update template

### User Profile
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update profile
- `GET /user/credits` - Get credits
- `GET /user/settings` - Get settings
- `PUT /user/settings` - Update settings

### Billing
- `GET /billing/plans` - Get credit plans
- `POST /billing/purchase` - Purchase credits
- `GET /billing/history` - Get transaction history
- `POST /billing/webhook` - Stripe webhook

### Admin
- `GET /admin/analytics` - Get analytics
- `GET /admin/users` - List users
- `PUT /admin/users/{id}/role` - Update user role
- `GET /admin/stats` - System statistics

### File Upload
- `POST /upload` - Upload image

### Export
- `POST /export/conversation` - Export conversation
- `POST /export/user-data` - Export user data
- `POST /export/analytics` - Export analytics

## Response Format
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## Error Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
