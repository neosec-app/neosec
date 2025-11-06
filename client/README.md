# NeoSec Frontend

React frontend application for the NeoSec authentication system.

## Features

- User registration
- User login
- Protected dashboard
- JWT token management
- Responsive design
- Error handling

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create `.env` file from `.env.example`:
```bash
copy .env.example .env
```

3. Start the development server:
```bash
npm start
```

The application will open automatically at http://localhost:3000

## Environment Variables

Create a `.env` file in the client directory (optional):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Note:** The default API URL is already set in the code. Only create this file if you need to use a different API URL.

## Project Structure

```
client/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── Auth/
│   │       ├── Login.js
│   │       └── Register.js
│   ├── services/
│   │   └── api.js          # API service functions
│   ├── App.js              # Main app component
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── package.json
└── README.md
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (irreversible)

## Features

### Authentication Flow

1. **Registration:**
   - User fills in email and password
   - Password must be at least 6 characters
   - Passwords must match
   - User receives confirmation message
   - Account requires admin approval

2. **Login:**
   - User enters email and password
   - JWT token is stored in localStorage
   - User is redirected to dashboard
   - If account is not approved, user sees pending message

3. **Dashboard:**
   - Displays user information
   - Shows approval status
   - Logout functionality

### API Integration

The frontend uses axios for API calls. All API functions are centralized in `src/services/api.js`.

- Automatic token attachment to requests
- Automatic token removal on 401 errors
- Error handling for network issues

## Customization

### Styling

The application uses CSS modules. Main styles are in `src/index.css`. You can customize:

- Colors: Change the gradient colors in `.auth-header` and `.btn-primary`
- Layout: Modify container widths and spacing
- Typography: Update font families and sizes

### API Configuration

To change the API URL:

1. Create `.env` file
2. Set `REACT_APP_API_URL` to your API URL
3. Restart the development server

## Troubleshooting

### CORS Errors

- Make sure the backend server is running
- Verify `ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:3000`
- Check API URL in frontend `.env` matches backend URL

### Login Not Working

- Check browser console for errors
- Verify API URL is correct
- Ensure backend server is running
- Check network tab for API response

### Build Errors

- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

## Production Build

To create a production build:

```bash
npm run build
```

This creates an optimized build in the `build` folder that can be deployed to any static hosting service.

## License

Part of CSE471 coursework.

