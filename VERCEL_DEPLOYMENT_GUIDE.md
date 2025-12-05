# Deploy NeoSec to Vercel - Complete Guide

This guide covers deploying your full-stack NeoSec application to Vercel.

**Architecture:**
- **Frontend (React):** Vercel
- **Backend (Express):** Vercel Serverless Functions OR separate platform (Render/Railway)
- **Database (PostgreSQL):** Render, Vercel Postgres, or Supabase

---

## Option 1: Full Vercel Deployment (Recommended)

Deploy both frontend and backend to Vercel using serverless functions.

---

## Part 1: Prepare Your Project

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Create `vercel.json` Configuration

Create `vercel.json` in your **project root**:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "server/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/app.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 3: Update Backend for Vercel

Vercel uses serverless functions, so we need to export the app differently.

**Update `server/app.js`:**

Add at the end of the file:

```javascript
// Export for Vercel serverless
module.exports = app;
```

**Make sure the file ends with:**
```javascript
// ... existing code ...

module.exports = app;
```

### Step 4: Update Client Build Script

**Update `client/package.json`:**

Add build script if not present:

```json
{
  "scripts": {
    "build": "react-scripts build",
    "vercel-build": "react-scripts build"
  }
}
```

---

## Part 2: Database Setup

### Option A: Use Vercel Postgres (Recommended for Vercel)

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Storage tab**
4. **Click "Create Database"**
5. **Select "Postgres"**
6. **Create database**
7. **Copy connection string**

### Option B: Use Render PostgreSQL (Free)

1. **Go to https://render.com/**
2. **Create PostgreSQL service**
3. **Get connection string**
4. **Use it in Vercel environment variables**

### Option C: Use Supabase (Free)

1. **Go to https://supabase.com/**
2. **Create project**
3. **Get connection string from Settings → Database**
4. **Use it in Vercel**

---

## Part 3: Deploy to Vercel

### Method 1: Using Vercel CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Navigate to project root:**
   ```bash
   cd "D:\CSE471 PROJECT\NeoSec"
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow prompts:**
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No** (first time)
   - Project name? **neosec** (or your choice)
   - Directory? **./** (current directory)
   - Override settings? **No**

5. **Set environment variables:**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add JWT_EXPIRE
   vercel env add ALLOWED_ORIGINS
   ```

### Method 2: Using Vercel Dashboard (Easier)

1. **Go to https://vercel.com/**
2. **Sign up/Login**
3. **Click "Add New Project"**
4. **Import your Git repository:**
   - Connect GitHub/GitLab/Bitbucket
   - Select your NeoSec repository
5. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (root)
   - **Build Command:** `cd client && npm run build`
   - **Output Directory:** `client/build`
6. **Add Environment Variables:**
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Your JWT secret key
   - `JWT_EXPIRE` - `7d`
   - `ALLOWED_ORIGINS` - Your Vercel frontend URL (will be set automatically)
   - `NODE_ENV` - `production`
7. **Click "Deploy"**

---

## Part 4: Environment Variables

### Required Environment Variables in Vercel:

1. **Go to Project Settings → Environment Variables**

2. **Add these variables:**

   ```
   DATABASE_URL=postgres://user:pass@host:port/database
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

3. **For each variable:**
   - **Key:** Variable name
   - **Value:** Your value
   - **Environment:** Production, Preview, Development (select all)

---

## Part 5: Update Frontend API URL

### Update `client/src/services/api.js`:

```javascript
// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-app.vercel.app/api'  // Your Vercel URL
    : 'http://localhost:5000/api');
```

**Or better, use Vercel's automatic URL:**

```javascript
const API_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' 
    ? `${window.location.origin}/api`  // Use same domain
    : 'http://localhost:5000/api');
```

### Add to Vercel Environment Variables:

```
REACT_APP_API_URL=https://your-app.vercel.app/api
```

---

## Option 2: Separate Deployment (Frontend on Vercel, Backend on Render)

This is often easier and more reliable for Express apps.

---

## Part 1: Deploy Frontend to Vercel

### Step 1: Update API URL

**Update `client/src/services/api.js`:**

```javascript
const API_URL = process.env.REACT_APP_API_URL || 
  'https://your-backend.onrender.com/api';  // Your backend URL
```

### Step 2: Deploy Frontend

1. **Go to Vercel Dashboard**
2. **Add New Project**
3. **Import repository**
4. **Configure:**
   - **Root Directory:** `client`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. **Add Environment Variable:**
   - `REACT_APP_API_URL` = Your backend URL
6. **Deploy**

---

## Part 2: Deploy Backend to Render

### Step 1: Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: neosec-backend
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false  # Set in Render dashboard
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRE
        value: 7d
      - key: ALLOWED_ORIGINS
        sync: false  # Set to your Vercel frontend URL
```

### Step 2: Deploy to Render

1. **Go to https://render.com/**
2. **New → Web Service**
3. **Connect your repository**
4. **Configure:**
   - **Name:** neosec-backend
   - **Environment:** Node
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
5. **Add Environment Variables:**
   - `DATABASE_URL` - Your PostgreSQL connection
   - `JWT_SECRET` - Your secret
   - `JWT_EXPIRE` - `7d`
   - `ALLOWED_ORIGINS` - Your Vercel frontend URL
   - `NODE_ENV` - `production`
6. **Deploy**

---

## Part 3: Update CORS Settings

**Update `server/app.js`:**

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

// Add your Vercel URL
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://your-app.vercel.app');
}
```

---

## Important Configuration Changes

### 1. Update Database Connection for Production

**Update `server/config/db.js`:**

```javascript
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,  // Disable logging in production
  dialectOptions: {
    ssl: process.env.DATABASE_URL?.includes('render.com') || 
         process.env.DATABASE_URL?.includes('amazonaws.com') ||
         process.env.DATABASE_URL?.includes('supabase.co')
      ? {
          require: true,
          rejectUnauthorized: false
        }
      : false
  }
});
```

### 2. Disable Auto-Sync in Production

**Update `server/config/db.js`:**

```javascript
if (process.env.NODE_ENV === 'development') {
  await sequelize.sync({ alter: true });
  console.log('Database models synchronized.');
} else {
  // In production, don't auto-sync
  // Use migrations instead
  console.log('Production mode - skipping auto-sync');
}
```

### 3. Update Package.json Scripts

**Update `server/package.json`:**

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

---

## Deployment Checklist

### Before Deploying:

- [ ] Database is set up (Vercel Postgres, Render, or Supabase)
- [ ] Environment variables are ready
- [ ] API URLs are updated in frontend
- [ ] CORS is configured for production URLs
- [ ] Database auto-sync is disabled in production
- [ ] Build scripts are correct
- [ ] All dependencies are in package.json

### After Deploying:

- [ ] Frontend is accessible
- [ ] Backend API endpoints work
- [ ] Database connection works
- [ ] Authentication works
- [ ] Admin features work
- [ ] Environment variables are set correctly

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
- Make sure all dependencies are in `package.json`
- Run `npm install` before deploying
- Check build logs in Vercel

### Issue: "Database connection failed"

**Solution:**
- Verify `DATABASE_URL` is correct in environment variables
- Check if database allows external connections
- Verify SSL settings for cloud databases

### Issue: "CORS errors"

**Solution:**
- Add your Vercel URL to `ALLOWED_ORIGINS`
- Update CORS configuration in `server/app.js`

### Issue: "API routes not working"

**Solution:**
- Check `vercel.json` routing configuration
- Verify API routes are in `server/` folder
- Check serverless function logs in Vercel

---

## Recommended Setup

**For easiest deployment:**

1. **Frontend:** Vercel (automatic deployments from Git)
2. **Backend:** Render (free tier, easy Express deployment)
3. **Database:** Render PostgreSQL (free tier)

**Why:**
- Vercel is excellent for React apps
- Render is better for Express/Node.js apps
- Everything stays on free tiers
- Easy to manage

---

## Quick Start Commands

### Deploy to Vercel (CLI):

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add JWT_EXPIRE
vercel env add ALLOWED_ORIGINS
```

### Deploy to Vercel (Dashboard):

1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Configure and deploy
5. Add environment variables

---

## Post-Deployment

After deployment:

1. **Test all features:**
   - Registration
   - Login
   - Dashboard
   - Admin features

2. **Check logs:**
   - Vercel: Project → Functions → View logs
   - Render: Logs tab

3. **Monitor:**
   - Check for errors
   - Verify database connections
   - Test API endpoints

---

**Need help?** Check Vercel documentation: https://vercel.com/docs

