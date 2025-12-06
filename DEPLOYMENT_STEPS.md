# Step-by-Step Guide: Deploy NeoSec to Vercel

This guide will walk you through deploying your NeoSec project to Vercel step by step.

---

## Prerequisites

- ✅ Your code is pushed to GitHub/GitLab/Bitbucket
- ✅ You have a Vercel account (free account works)
- ✅ PostgreSQL database (we'll set this up)

---

## Step 1: Set Up Database

You need a PostgreSQL database. Choose one option:

### Option A: Vercel Postgres (Recommended - Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Go to your **Dashboard**
3. Click on **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name (e.g., `neosec-db`)
7. Select a region (closest to you)
8. Click **Create**
9. **Copy the connection string** - you'll need this later
   - It looks like: `postgres://user:password@host:port/database`

### Option B: Supabase (Free Alternative)

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click **New Project**
4. Fill in:
   - Name: `neosec`
   - Database Password: (create a strong password)
   - Region: (choose closest)
5. Click **Create new project**
6. Wait for setup (2-3 minutes)
7. Go to **Settings** → **Database**
8. Scroll to **Connection string** → **URI**
9. **Copy the connection string**

### Option C: Render PostgreSQL (Free Alternative)

1. Go to [render.com](https://render.com)
2. Sign up/Login
3. Click **New +** → **PostgreSQL**
4. Fill in:
   - Name: `neosec-db`
   - Database: `neosec`
   - User: `neosec_user`
   - Region: (choose closest)
5. Click **Create Database**
6. Wait for creation (2-3 minutes)
7. Go to **Info** tab
8. **Copy the Internal Database URL**

---

## Step 2: Prepare Your Code

Your project is already configured! The following files are ready:
- ✅ `vercel.json` - Configured for frontend and backend
- ✅ `server/app.js` - Exports app for Vercel
- ✅ `client/src/services/api.js` - Uses dynamic API URL

**Make sure your code is pushed to GitHub:**
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## Step 3: Deploy to Vercel (Dashboard Method - Easiest)

### 3.1: Import Your Project

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project** or **Import Project**
3. **Connect your Git provider** (GitHub/GitLab/Bitbucket)
   - Authorize Vercel if needed
4. **Select your NeoSec repository**
5. Click **Import**

### 3.2: Configure Project Settings

In the project configuration page:

1. **Project Name:** `neosec` (or your choice)
2. **Framework Preset:** Leave as **Other** (or select "Create React App")
3. **Root Directory:** Leave as `./` (root directory)
4. **Build Command:** 
   ```
   cd client && npm install && npm run build
   ```
5. **Output Directory:** 
   ```
   client/build
   ```
6. **Install Command:** Leave empty (Vercel will auto-detect)

### 3.3: Add Environment Variables

**Click "Environment Variables"** and add these one by one:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `DATABASE_URL` | `postgres://...` | Your PostgreSQL connection string from Step 1 |
| `JWT_SECRET` | `your_super_secret_key_here` | A random secret key (e.g., use `openssl rand -hex 32`) |
| `JWT_EXPIRE` | `7d` | Token expiration time |
| `NODE_ENV` | `production` | Environment mode |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | **Leave this for now, we'll update after first deploy** |

**For each variable:**
- Click **Add**
- Enter the **Key** and **Value**
- Select **Production**, **Preview**, and **Development** (all three)
- Click **Save**

### 3.4: Deploy

1. Click **Deploy** button
2. Wait for deployment (2-5 minutes)
3. You'll see build logs in real-time
4. When done, you'll get a URL like: `https://neosec-xxxxx.vercel.app`

---

## Step 4: Update Environment Variables with Your URL

After the first deployment:

1. Go to your project on Vercel
2. Go to **Settings** → **Environment Variables**
3. Find `ALLOWED_ORIGINS`
4. Click **Edit**
5. Update the value to your actual Vercel URL:
   ```
   https://neosec-xxxxx.vercel.app
   ```
6. Click **Save**
7. Go to **Deployments** tab
8. Click the **three dots** (⋯) on the latest deployment
9. Click **Redeploy** to apply the new environment variable

---

## Step 5: Initialize Your Database

Your database is empty. You need to create the tables. You have two options:

### Option A: Run SQL Script (Recommended)

1. Go to your database provider's dashboard
2. Find the **SQL Editor** or **Query Tool**
3. Copy the contents of `ig/test-data-setup.sql`
4. Run the SQL script to create tables
5. Or use the migration commands from your setup guide

### Option B: Enable Auto-Sync (Temporary - Development Only)

⚠️ **Only for testing!** Don't use in production long-term.

1. In Vercel, go to **Environment Variables**
2. Temporarily add: `NODE_ENV` = `development`
3. Redeploy
4. This will auto-create tables (not recommended for production)

---

## Step 6: Test Your Deployment

1. **Visit your Vercel URL:** `https://your-app.vercel.app`
2. **Test the following:**
   - ✅ Frontend loads correctly
   - ✅ Registration works
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ API endpoints work (check browser console)

### Check API Health:
Visit: `https://your-app.vercel.app/api/health`
You should see: `{"success":true,"message":"Server is running",...}`

---

## Step 7: Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Enter your domain name
3. Follow Vercel's instructions to add DNS records
4. Wait for SSL certificate (automatic, takes a few minutes)

---

## Troubleshooting

### Issue: "Module not found" errors
**Solution:**
- Check that all dependencies are in `package.json`
- Check build logs in Vercel dashboard
- Make sure `node_modules` is in `.gitignore`

### Issue: "Database connection failed"
**Solution:**
- Verify `DATABASE_URL` is correct in environment variables
- Check if database allows external connections
- For Supabase/Render: Make sure SSL is enabled (already configured in your code)

### Issue: "CORS errors"
**Solution:**
- Make sure `ALLOWED_ORIGINS` includes your Vercel URL
- Check that the URL doesn't have a trailing slash
- Redeploy after updating environment variables

### Issue: "API routes return 404"
**Solution:**
- Check `vercel.json` routing configuration
- Make sure routes start with `/api/`
- Check serverless function logs in Vercel dashboard

### Issue: "Build fails"
**Solution:**
- Check build logs for specific errors
- Make sure `client/package.json` has a `build` script
- Verify Node.js version (Vercel auto-detects, but you can set it in settings)

---

## Quick Reference: Environment Variables Checklist

Before deploying, make sure you have:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Random secret key (32+ characters)
- [ ] `JWT_EXPIRE` - Token expiration (e.g., `7d`)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `ALLOWED_ORIGINS` - Your Vercel URL (update after first deploy)

---

## Post-Deployment Checklist

After deployment:

- [ ] Frontend is accessible
- [ ] API health check works (`/api/health`)
- [ ] Database connection works
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads
- [ ] Admin features work (if applicable)
- [ ] No console errors in browser
- [ ] Environment variables are set correctly

---

## Alternative: Deploy Using Vercel CLI

If you prefer command line:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Navigate to project root
cd "D:\CSE471 PROJECT\NeoSec"

# 4. Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No (first time)
# - Project name? neosec
# - Directory? ./

# 5. Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add JWT_EXPIRE
vercel env add NODE_ENV
vercel env add ALLOWED_ORIGINS

# 6. Deploy to production
vercel --prod
```

---

## Need Help?

- **Vercel Documentation:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Check your deployment logs:** Vercel Dashboard → Your Project → Deployments → Click on deployment → View logs

---

## Summary

1. ✅ Set up PostgreSQL database (Vercel Postgres/Supabase/Render)
2. ✅ Push code to GitHub
3. ✅ Import project to Vercel
4. ✅ Configure build settings
5. ✅ Add environment variables
6. ✅ Deploy
7. ✅ Update `ALLOWED_ORIGINS` with your URL
8. ✅ Initialize database tables
9. ✅ Test everything
10. ✅ Done! 🎉

Your app will be live at: `https://your-app.vercel.app`

