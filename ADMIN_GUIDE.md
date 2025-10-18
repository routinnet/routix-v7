# Routix Admin Guide

## Admin Dashboard

### User Management
- View all users
- Promote/demote roles
- Reset passwords
- Ban/unban users

### Analytics
- Total users, conversations, thumbnails
- Daily/monthly trends
- Revenue metrics
- API usage statistics

### System Settings
- Configure email templates
- Set credit prices
- Manage AI models
- Configure webhooks

### Monitoring
- Error logs
- Performance metrics
- Database health
- API status

## Maintenance Tasks

### Daily
- Monitor error logs
- Check system health
- Review user reports

### Weekly
- Backup database
- Review analytics
- Update content

### Monthly
- Performance review
- Security audit
- Cost analysis

## Emergency Procedures

### Database Recovery
```bash
pnpm db:restore backup.sql
```

### Clear Cache
```bash
redis-cli FLUSHALL
```

### Reset User
```bash
pnpm admin:reset-user [user-id]
```
