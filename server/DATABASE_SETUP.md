# Database Setup Guide

## Using Both Local and Render Databases

This project supports both local development and Render production databases.

### Local Development (Your Computer)

1. **Keep your `.env` file with local database:**
   ```env
   DATABASE_URL=postgres://postgres:saadat123@localhost:5432/neosec
   ```

2. **Make sure PostgreSQL is running locally:**
   - Start PostgreSQL service
   - Create database: `createdb neosec` (or use pgAdmin)

3. **Run locally:**
   ```bash
   npm start
   ```
   This will use your local database from `.env`

### Render Production (Cloud)

1. **In Render Dashboard:**
   - Go to your service → Environment tab
   - Add environment variable: `DATABASE_URL`
   - Set value to your Render PostgreSQL database connection string
   - Format: `postgres://user:password@host:5432/dbname`

2. **Render automatically:**
   - Uses environment variables from dashboard (overrides `.env`)
   - Detects Render database URLs and enables SSL
   - Works seamlessly with your code

### How It Works

- **Local**: Uses `DATABASE_URL` from `server/.env` file
- **Render**: Uses `DATABASE_URL` from Render dashboard (environment variables)
- The code automatically detects Render databases and enables SSL
- No code changes needed - just set the right `DATABASE_URL` in each environment

### Quick Switch

To test with different databases:
- **Local**: Update `DATABASE_URL` in `server/.env`
- **Render**: Update `DATABASE_URL` in Render dashboard
- Restart the server

### Current Setup

- ✅ Local: `postgres://postgres:saadat123@localhost:5432/neosec` (in `.env`)
- ⚙️ Render: Set in Render dashboard → Environment tab

