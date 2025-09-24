# 🚀 Metronix App Deployment Guide

This guide will walk you through deploying the Metronix complaint management system to production using Vercel and Supabase.

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free tier)
- [ ] Supabase account (free tier)
- [ ] Email service (Gmail or other SMTP provider)

## 🔧 Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Fill in project details:
   - **Name**: `metronix-app`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users

### 1.2 Get Database Connection String
1. Wait for project to initialize (~2 minutes)
2. Go to **Settings** → **Database**
3. Find **Connection string**
4. Select **Connection pooling** option
5. Copy the connection string

### 1.3 Test Connection
```bash
# Test locally first
DATABASE_URL="your-supabase-connection-string" npm run dev
```

## 📧 Step 2: Email Configuration

### 2.1 Gmail Setup (Recommended for free tier)
1. Enable 2-factor authentication on your Gmail
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Generate **App Password**:
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password

### 2.2 Email Environment Variables
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

## 🔐 Step 3: Authentication Setup

### 3.1 Generate NextAuth Secret
```bash
# Run this command to generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.2 Set NextAuth URL
```bash
# For production (replace with your actual domain)
NEXTAUTH_URL=https://your-app.vercel.app

# For development
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Step 4: Vercel Deployment

### 4.1 Push Code to GitHub
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/metronix-app.git
git branch -M main
git push -u origin main
```

### 4.2 Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see next section)
5. Click "Deploy"

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and configure environment variables
```

### 4.3 Environment Variables in Vercel
Add these to your Vercel project settings:

```bash
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Authentication
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**Important**: Use the `@` prefix for sensitive values in Vercel:
- `@nextauth_secret`
- `@database_url`
- `@smtp_pass`

## 🔄 Step 5: Database Migration

### 5.1 Generate Prisma Migration
```bash
# Generate migration files
npx prisma migrate dev --name init

# This creates a migration in prisma/migrations/
```

### 5.2 Apply Migrations in Production
Vercel will automatically run migrations during build with our `vercel-build` script.

### 5.3 Manual Migration (if needed)
```bash
# Connect to your Supabase database
# Run migrations manually
npx prisma migrate deploy
```

## ✅ Step 6: Verification

### 6.1 Test Core Functionality
1. **User Registration**: Create a new account
2. **Complaint Submission**: Submit a test complaint
3. **Email Notifications**: Check if emails are sent
4. **Admin Dashboard**: Test admin features
5. **Solver Assignment**: Test complaint assignment

### 6.2 Check Logs
- Vercel: Go to your project → Functions → Logs
- Supabase: Go to your project → Logs → Database

## 🔧 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check if all dependencies are installed
npm install

# Check for TypeScript errors
npm run build
```

**Database Connection Issues**
- Verify `DATABASE_URL` is correct
- Check if Supabase project is active
- Ensure connection pooling is enabled

**Authentication Not Working**
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Ensure cookies are enabled

**Email Not Sending**
- Verify SMTP credentials
- Check email provider limits
- Test with a simple SMTP client

### Getting Help
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed configuration
- Review Vercel logs for specific errors
- Check Supabase connection status

## 📊 Monitoring

### Vercel Analytics
- Built-in performance monitoring
- Real-time logs and errors
- Function execution metrics

### Supabase Dashboard
- Database performance
- Connection pool usage
- Query performance insights

### Email Monitoring
- Gmail: Check sent folder
- Set up email forwarding for monitoring
- Consider upgrading for higher limits

## 🆓 Free Tier Limits

### Vercel Free Tier
- 100GB bandwidth/month
- 6000 build minutes/month
- Serverless functions: 10s timeout
- 1 concurrent build

### Supabase Free Tier
- 500MB database storage
- 2GB bandwidth/month
- 50,000 monthly active users
- 1GB file storage

### Gmail Free Tier
- 500 emails/day
- Standard SMTP limits
- Consider upgrading for production use

## 🚀 Next Steps

1. **Custom Domain**: Add your own domain in Vercel
2. **SSL Certificate**: Automatically provided by Vercel
3. **Performance Optimization**: Enable caching and CDN
4. **Security**: Review and configure security headers
5. **Backup**: Set up database backups in Supabase
6. **Monitoring**: Add error tracking (e.g., Sentry)

## 📞 Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **GitHub Issues**: Create an issue in your repository

---

**🎉 Congratulations!** Your Metronix app should now be successfully deployed and running in production.