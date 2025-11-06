# NeoSec Backend Server

Express.js backend server with Sequelize ORM and PostgreSQL database.

## Features

- User registration with email and password
- Admin approval workflow
- JWT-based authentication
- Password hashing with bcryptjs
- Input validation with express-validator
- CORS enabled for frontend communication

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database (local or cloud)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
copy .env.example .env
```

3. Configure your `.env` file with your PostgreSQL connection string and other settings.

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://username:password@host:port/database
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

## Project Structure

```
server/
├── config/
│   └── db.js              # Sequelize database configuration
├── controllers/
│   └── authController.js  # Authentication logic
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── models/
│   └── User.js            # User Sequelize model
├── routes/
│   └── authRoutes.js      # Authentication routes
├── validations/
│   └── authValidation.js  # Input validation rules
├── app.js                 # Express app entry point
└── package.json           # Dependencies
```

## API Endpoints

### Public Routes

- `POST /api/auth/register` - Register a new user
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Response: `{ "success": true, "message": "Registration successful! Please wait for admin approval." }`

- `POST /api/auth/login` - Login user
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Response: `{ "success": true, "token": "jwt_token", "user": {...} }`

### Protected Routes

- `GET /api/auth/me` - Get current user
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ "success": true, "user": {...} }`

### Health Check

- `GET /api/health` - Server health check

## Database Models

### User Model

- `id` (UUID, Primary Key)
- `email` (String, Unique, Required)
- `password` (String, Hashed, Required)
- `isApproved` (Boolean, Default: false)
- `role` (Enum: 'user' | 'admin', Default: 'user')
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## Security Features

- Password hashing with bcryptjs (salt rounds: 10)
- JWT token authentication
- Input validation on all routes
- CORS protection
- Environment variable protection

## Development

The server uses `nodemon` for automatic restart during development:

```bash
npm run dev
```

## Production

For production, use:

```bash
npm start
```

## Database Setup

1. Create a PostgreSQL database (local or cloud)
2. Update `DATABASE_URL` in `.env` file
3. The server will automatically create tables on startup (development mode)

**Note:** In production, use migrations instead of `sync()` for database schema management.

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL service is running (local)
- Verify network access (cloud databases)
- Check SSL requirements for cloud databases

### Port Already in Use

- Change `PORT` in `.env` file
- Or stop the process using port 5000

### JWT Errors

- Verify `JWT_SECRET` is set in `.env`
- Check token expiration settings

## License

Part of CSE471 coursework.

