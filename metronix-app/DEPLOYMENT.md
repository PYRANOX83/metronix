# Environment Variables Configuration

This document outlines all the environment variables required for deploying the Metronix application.

## Required Environment Variables

### NextAuth Configuration
```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-32-character-secret-key-here
```

**NEXTAUTH_SECRET**: Generate a random 32-character string using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Configuration (Supabase PostgreSQL)
```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

**Getting DATABASE_URL from Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → Database
3. Copy the connection string under "Connection string"
4. Make sure to use the "Connection pooling" option for serverless

### Email Configuration (SMTP)
```bash
SMTP_HOST=smtp.gmail.com  # or your SMTP provider
SMTP_PORT=587               # or 465 for SSL
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use the app password as SMTP_PASS

**For other providers:**
- Check your email provider's SMTP settings
- Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)

## Development vs Production

### Development (.env.local)
```bash
# Local development
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db  # SQLite for development
# ... other variables
```

### Production (Vercel)
Add these to your Vercel project settings:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all the variables listed above
3. Use the @ prefix for sensitive values (e.g., @nextauth_secret)

## Supabase Setup Guide

### 1. Create Supabase Account
1. Visit https://supabase.com
2. Sign up for a free account
3. Create a new project

### 2. Database Setup
1. Once project is created, go to SQL Editor
2. Run the following to create your database schema:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (Prisma will handle this, but you can verify)
-- The schema should match your Prisma schema
```

### 3. Get Connection String
1. Go to Settings → Database
2. Find "Connection string"
3. Choose "Connection pooling" for serverless deployments
4. Copy the URL and add to your environment variables

### 4. Security Settings
1. Go to Authentication → Settings
2. Configure your auth providers if needed
3. Set up row-level security (RLS) policies as needed

## Vercel Deployment Steps

### 1. Connect Repository
1. Push your code to GitHub
2. Go to Vercel dashboard
3. Click "New Project"
4. Import your GitHub repository

### 2. Configure Environment Variables
1. In the project setup, add all environment variables
2. Or go to Settings → Environment Variables after deployment

### 3. Deploy
1. Vercel will automatically deploy on push to main branch
2. Check build logs for any issues
3. Visit your deployed URL

## Troubleshooting

### Common Issues

**Build fails with database errors:**
- Ensure DATABASE_URL is correct
- Check if Prisma migrations are applied
- Verify database connection from Vercel

**Authentication not working:**
- Verify NEXTAUTH_URL matches your deployment URL
- Ensure NEXTAUTH_SECRET is set
- Check if cookies are being set properly

**Emails not sending:**
- Verify SMTP credentials
- Check email provider settings
- Test with a simple SMTP client first

### Database Migration Commands
```bash
# Generate migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Security Best Practices

1. **Never commit .env files** - They're already in .gitignore
2. **Use strong secrets** - Generate random strings for secrets
3. **Rotate credentials** - Change passwords periodically
4. **Use connection pooling** - For serverless deployments
5. **Enable RLS** - Row Level Security in Supabase
6. **Monitor usage** - Keep track of database and email usage

## Free Tier Limits

### Supabase Free Tier
- 500MB database storage
- 2GB bandwidth per month
- 50,000 monthly active users
- 1GB file storage

### Vercel Free Tier
- 100GB bandwidth per month
- 6000 build minutes per month
- Serverless functions: 10s timeout
- 1 concurrent build

### Email Limits
- Gmail: 500 emails per day (free)
- Other providers vary - check their limits