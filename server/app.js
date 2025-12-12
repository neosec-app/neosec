const express = require('express');
const cors = require('cors');
require('dotenv').config();

// IMPORTANT: Load models BEFORE connecting to database
const User = require('./models/User');
const VpnConfig = require('./models/VpnConfig');
const Notification = require('./models/Notification');
const Threat = require('./models/Threat');
const FirewallRule = require('./models/FirewallRule');
const DataTransfer = require('./models/DataTransfer');

// NEW: Add hierarchy models
const Group = require('./models/Group');
const GroupMember = require('./models/GroupMember');
const Invitation = require('./models/Invitation');
const Subscription = require('./models/Subscription');

// NEW: Set up associations
require('./models/associations');

// Now connect to database (this will sync the models)
const { connectDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
require("./scheduler");

const VpnRoutes = require('./routes/VpnRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hierarchyRoutes = require('./routes/hierarchyRoutes');
const scanRoutes = require('./routes/scanRoutes');
const firewallRoutes = require('./routes/firewallRoutes');


// Initialize Express app
const app = express();

// Connect to database
connectDB();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } 
        // Also allow any Vercel preview URL in production
        else if (process.env.NODE_ENV === 'production' && origin.includes('.vercel.app')) {
            callback(null, true);
        } 
        else {
            console.log('CORS blocked origin:', origin);
            console.log('Allowed origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profiles', profileRoutes);

app.use('/api/vpn', VpnRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/firewall', firewallRoutes);
const dataTransferRoutes = require('./routes/dataTransferRoutes');
app.use('/api/data-transfer', dataTransferRoutes);


// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to NeoSec API',
        version: '1.0.0'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
// Render provides PORT environment variable automatically
const PORT = process.env.PORT || 5000;

// Check required environment variables
if (!process.env.JWT_SECRET) {
    console.error('ERROR: JWT_SECRET environment variable is not set!');
    console.error('Please set JWT_SECRET in your environment variables.');
}

if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set!');
    console.error('Please set DATABASE_URL in your environment variables.');
}

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET - THIS WILL CAUSE ERRORS!'}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'NOT SET - THIS WILL CAUSE ERRORS!'}`);
});


module.exports = app;

