# NeoSec Project - PostgreSQL Edition

A full-stack authentication application with React frontend and Express backend, using PostgreSQL database with Sequelize ORM.

## Features

- User registration with email and password
- Admin approval workflow for new users
- JWT-based authentication
- Protected routes
- Modern React frontend
- RESTful API backend

---

## Prerequisites

- **Node.js** (v14 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
  - Verify npm: `npm --version`

- **PostgreSQL**
  - **Option A: Local PostgreSQL** (with pgAdmin)
    - Download from: https://www.postgresql.org/download/
    - The installer usually includes pgAdmin, a required tool for managing your database
  - **Option B: Render** (Cloud - Recommended for beginners)
    - Sign up at: https://render.com/
    - Create a new "PostgreSQL" service. It's free.
    - Get the "External Connection String" from the dashboard.

- **Git**
  - Download from: https://git-scm.com/downloads
  - Verify installation: `git --version`

- **Code Editor** (Optional but recommended)
  - Visual Studio Code: https://code.visualstudio.com/

---

## Step 1: Clone Repository

1. Open Command Prompt (Windows) or Terminal (Mac/Linux)
2. Navigate to the directory where you want to clone the project:
   ```bash
   cd C:\Projects
   ```
   (or your preferred directory)
3. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
   Example: `git clone https://github.com/yourusername/neosec.git`
4. Navigate into the project directory:
   ```bash
   cd neosec
   ```

---

## Step 2: Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```
   This will install:
   - express
   - sequelize (This replaces mongoose)
   - pg (The driver for PostgreSQL)
   - cors
   - dotenv
   - bcryptjs
   - jsonwebtoken
   - express-validator
   - nodemon (dev dependency)

3. Set up PostgreSQL:

   **Option A: Using Render (Cloud)**
   - Go to https://render.com/
   - Create a free account
   - Create a new "PostgreSQL" service
   - Wait for it to deploy.
   - From your Render dashboard, find the "Connections" section.
   - Copy the "External Connection String".
   - Format: `postgres://username:password@host.render.com/database`

   **Option B: Using Local PostgreSQL**
   - Install PostgreSQL and pgAdmin.
   - Start the PostgreSQL service.
   - Open pgAdmin.
   - Create a new login/user (or use the default postgres user).
   - Create a new database (e.g., neosec).
   - Connection string: `postgres://your_username:your_password@localhost:5432/neosec`

4. Create environment file:

   **Windows:**
   ```bash
   copy .env.example .env
   ```

   **Mac/Linux:**
   ```bash
   cp .env.example .env
   ```

   Or manually create a file named `.env` in the server directory

5. Edit the `.env` file with your configuration:

   Open `.env` file in a text editor and add:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=your_postgresql_connection_string_here
   ALLOWED_ORIGINS=http://localhost:3000
   JWT_SECRET=neosec_is_secure_but_please_change_this_to_a_strong_secret
   JWT_EXPIRE=7d
   ```

   **IMPORTANT:**
   - Replace `"your_postgresql_connection_string_here"` with your actual connection string from step 3.

6. Verify backend setup:

   - Make sure your PostgreSQL service is running (if using local PostgreSQL).
   - Start the backend server:
     ```bash
     npm run dev
     ```
   - You should see:
     - "Database connected successfully..."
     - "Server started on port 5000"

   If you see errors, check:
   - DATABASE_URL connection string is correct.
   - PostgreSQL service is running (for local).
   - Port 5000 is not already in use.

---

## Step 3: Frontend Setup

1. Open a **NEW** terminal/command prompt window (keep backend running)

2. Navigate to the client directory:
   ```bash
   cd client
   ```
   (Make sure you're in the project root first: `cd ..` then `cd client`)

3. Install frontend dependencies:
   ```bash
   npm install
   ```

4. (Optional) Create environment file:

   Create a file named `.env` in the client directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```
   Note: This is optional as the default is already set in the code, but you can customize it here if needed.

5. Start the frontend development server:
   ```bash
   npm start
   ```

6. The application should automatically open in your browser at: http://localhost:3000

---

## Step 4: Verify Setup

- **Backend should be running:**
  - Terminal should show: "Server started on port 5000"
  - Database connection should be established

- **Frontend should be running:**
  - Browser should open automatically
  - You should see the NeoSec homepage with Login/Register forms

- **Test Registration:**
  - Click "Register" tab
  - Fill in the form:
    - Email
    - Password
  - Click "Register"
  - You should see: "Registration successful! Please wait for admin approval."

- **Test Login (after admin approval):**
  - Note: Login will only work after admin approves the user
  - For testing, you can manually approve users in PostgreSQL (using pgAdmin).

---

## Common Issues & Solutions

### ISSUE: "Cannot find module" errors
**SOLUTION:**
- Make sure you ran `npm install` in both server and client directories

### ISSUE: "PostgreSQL connection error"
**SOLUTION:**
- Check DATABASE_URL string in .env file
- Verify PostgreSQL service is running (for local)
- Check if your IP is whitelisted (for Render or other cloud DBs)
- Verify username and password are correct

### ISSUE: "Port already in use"
**SOLUTION:**
- Change PORT in server/.env file
- Or stop the process using the port

### ISSUE: "CORS error"
**SOLUTION:**
- Make sure ALLOWED_ORIGINS in server/.env includes `http://localhost:3000`

### ISSUE: "User already exists" error
**SOLUTION:**
- The email is already registered
- Try with a different email or delete the user from PostgreSQL (using pgAdmin)

### ISSUE: "Account pending approval" after login
**SOLUTION:**
- This is expected behavior for new registrations
- For testing, you can manually set `isApproved: true` in the users table in PostgreSQL.

---

## Project Structure

```
neosec/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
│
├── server/                    # Express backend
│   ├── config/                # Configuration files (db.js - Sequelize setup)
│   ├── controllers/           # Route controllers (authController)
│   ├── middleware/            # Custom middleware (auth.js)
│   ├── models/                # Sequelize models (User.js)
│   ├── routes/                # API routes (authRoutes.js)
│   ├── validations/           # Input validation (authValidation.js)
│   ├── app.js                 # Express app entry point
│   └── package.json           # Backend dependencies
│
└── README.md                  # Project documentation
```

### CRITICAL NOTE ON server/models/ DIRECTORY
This is the most important change. Your old models/User.js file (written for Mongoose) will not work. You must rewrite it to use the Sequelize format.

**Mongoose Model (Old):**
```javascript
const userSchema = new mongoose.Schema({
  email: String,
  ...
});
```

**Sequelize Model (New):**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    ...
  },
  ...
});
```

---

## API Endpoints

**Base URL:** `http://localhost:5000/api`

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user (protected route)

---

## Running the Application

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm start
```

**Browser:**
Navigate to: http://localhost:3000

---

## Environment Variables

### SERVER (.env in server/ directory):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://your_user:your_password@localhost:5432/neosec
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=neosec_is_secure
JWT_EXPIRE=7d
```

### CLIENT (.env in client/ directory - Optional):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Useful Commands

**Backend:**
- `npm install` - Install dependencies
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

**Frontend:**
- `npm install` - Install dependencies
- `npm start` - Start development server
- `npm run build` - Build for production

---

## Next Steps

1. Set up your PostgreSQL database (local or cloud)
2. Configure environment variables in both server and client
3. Run the application
4. Test registration and login functionality
5. Customize the application according to your needs

---

## Support

If you encounter issues:

1. Check the Common Issues section above
2. Verify all prerequisites are installed
3. Check console logs for specific error messages
4. Ensure PostgreSQL is running and accessible
5. Verify environment variables are set correctly

---

## License

This project is part of the CSE471 coursework.

