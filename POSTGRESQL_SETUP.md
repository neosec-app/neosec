# PostgreSQL Setup Guide - Local Installation

## Option 2: Local PostgreSQL Installation

### Step 1: Download PostgreSQL
1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download PostgreSQL (latest version, ~150MB)

### Step 2: Install PostgreSQL
1. Run the installer
2. **Important settings during installation:**
   - Port: Keep default (5432)
   - **Superuser password:** Set a password (remember this!)
   - Locale: Default
   - Components: Install everything (includes pgAdmin)

### Step 3: Install pgAdmin (if not included)
- pgAdmin is usually installed with PostgreSQL
- If not, download from: https://www.pgadmin.org/download/

### Step 4: Create Database
1. Open **pgAdmin** (from Start Menu)
2. Connect to PostgreSQL server:
   - Password: (the one you set during installation)
3. Right-click "Databases" → Create → Database
4. Database name: `neosec`
5. Click Save

### Step 5: Update .env file
Your connection string format:
```
postgres://postgres:YOUR_PASSWORD@localhost:5432/neosec
```

Replace in `server/.env`:
```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/neosec
```

**Important:** Replace `YOUR_PASSWORD` with your actual PostgreSQL password!

### Step 6: Start PostgreSQL Service
- Make sure PostgreSQL service is running:
  - Windows: Services → PostgreSQL → Start (if not running)
  - Or PostgreSQL usually starts automatically

