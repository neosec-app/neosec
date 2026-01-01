const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const jwt = require('jsonwebtoken');
const { getLocationFromIP } = require('../services/ipGeolocationService');
const { getClientIP } = require('../utils/ipUtils');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if User model is available
    if (!User) {
      console.error('User model is not available');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error - models not loaded'
      });
    }

    // Test database connection first
    const { sequelize } = require('../config/db');
    try {
      await sequelize.authenticate();
    } catch (connError) {
      console.error('Database connection error in register:', connError.message);
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.'
      });
    }

    // Find existing user
    let existingUser;
    try {
      existingUser = await User.findOne({ where: { email } });
    } catch (dbError) {
      console.error('Database error checking existing user:', dbError);
      console.error('Database error details:', dbError.message);
      console.error('Database error stack:', dbError.stack);
      return res.status(500).json({
        success: false,
        message: 'Database error. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // First user becomes admin
    let userCount;
    try {
      userCount = await User.count();
    } catch (dbError) {
      console.error('Database error counting users:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error. Please try again later.'
      });
    }

    const isFirstUser = userCount === 0;

    // Create user
    let user;
    try {
      user = await User.create({
        email,
        password,
        isApproved: true,
        role: isFirstUser ? 'admin' : 'user',
        accountType: isFirstUser ? 'admin' : 'user',
        subscriptionTier: 'free',
        isPaid: false
      });
    } catch (createError) {
      console.error('Error creating user:', createError);
      console.error('Create error details:', createError.message);
      console.error('Create error stack:', createError.stack);
      return res.status(500).json({
        success: false,
        message: 'Error creating user account. Please try again.',
        error: process.env.NODE_ENV === 'development' ? createError.message : undefined
      });
    }

    res.status(201).json({
      success: true,
      message: isFirstUser
        ? 'Registration successful. Admin account created.'
        : 'Registration successful. Please login.'
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Register error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Check if User model is available
    if (!User) {
      console.error('User model is not available');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error - models not loaded'
      });
    }

    // Test database connection first
    const { sequelize } = require('../config/db');
    try {
      // Test connection with a simple query
      await sequelize.authenticate();
      
      // Verify the users table exists and is accessible
      const [results] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      if (!results || !results[0] || !results[0].exists) {
        throw new Error('Users table does not exist in database');
      }
    } catch (connError) {
      console.error('Database connection error in login:', connError.message);
      console.error('Connection error stack:', connError.stack);
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? connError.message : undefined
      });
    }

    // Find user by email
    let user;
    try {
      // Ensure database connection is ready
      const { sequelize } = require('../config/db');
      if (!sequelize) {
        throw new Error('Database connection not available');
      }
      
      // Test connection before query
      await sequelize.authenticate();
      
      // Query user by email (Sequelize handles column name conversion automatically)
      user = await User.findOne({ 
        where: { email: email.toLowerCase().trim() },
        raw: false // Ensure we get a model instance, not plain object
      });
    } catch (dbError) {
      console.error('Database error finding user:', dbError);
      console.error('Database error details:', dbError.message);
      console.error('Database error stack:', dbError.stack);
      console.error('Database error name:', dbError.name);
      
      // Provide more helpful error messages
      let errorMessage = 'Database error. Please try again later.';
      if (process.env.NODE_ENV === 'development') {
        errorMessage = `Database error: ${dbError.message}`;
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? {
          message: dbError.message,
          name: dbError.name,
          stack: dbError.stack
        } : undefined
      });
    }

    // Log failed login attempt - use proper IP extraction
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Login attempt - Extracted IP:', ipAddress, 'From headers:', {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'req.ip': req.ip,
        'remoteAddress': req.connection?.remoteAddress
      });
    }
    
    // Get location from IP (async, don't block login)
    let location = 'Unknown';
    try {
      location = await getLocationFromIP(ipAddress);
    } catch (err) {
      console.error('Error getting location:', err);
      // Continue with 'Unknown' if location fetch fails
    }
    
    if (!user) {
      // Log failed login attempt (user not found)
      try {
        await LoginHistory.create({
          userId: null, // User not found
          ipAddress,
          userAgent,
          location,
          success: false,
          failureReason: 'User not found',
          suspiciousActivity: true
        });
      } catch (logError) {
        console.error('Error logging failed login:', logError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    let isPasswordMatch;
    try {
      isPasswordMatch = await user.comparePassword(password);
    } catch (pwdError) {
      console.error('Password comparison error:', pwdError);
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication'
      });
    }

    if (!isPasswordMatch) {
      // Log failed login attempt (wrong password)
      try {
        // Check for suspicious activity (multiple failed attempts from same IP)
        const { Op } = require('sequelize');
        const recentFailures = await LoginHistory.count({
          where: {
            ipAddress,
            success: false,
            createdAt: {
              [Op.gte]: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
            }
          }
        });

        await LoginHistory.create({
          userId: user.id,
          ipAddress,
          userAgent,
          location,
          success: false,
          failureReason: 'Invalid password',
          suspiciousActivity: recentFailures >= 3 // Mark as suspicious if 3+ failures in 15 min
        });
      } catch (logError) {
        console.error('Error logging failed login:', logError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is approved
    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Account pending approval. Please wait for admin approval.'
      });
    }

    // Generate token
    let token;
    try {
      token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    } catch (tokenError) {
      console.error('JWT token generation error:', tokenError);
      return res.status(500).json({
        success: false,
        message: 'Server error during token generation'
      });
    }

    // Log login history (ipAddress and userAgent already declared above)
    try {
      await LoginHistory.create({
        userId: user.id,
        ipAddress,
        userAgent,
        location,
        success: true,
        suspiciousActivity: false
      });
    } catch (logError) {
      console.error('Error logging login history:', logError);
      // Don't fail login if logging fails
    }

    // IMPORTANT: return FULL user state
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        subscriptionTier: user.subscriptionTier,
        isPaid: user.isPaid,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is already populated by protect middleware
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id',
        'email',
        'name',
        'phone',
        'role',
        'accountType',
        'subscriptionTier',
        'isPaid',
        'isApproved',
        'createdAt'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }
    }

    // Update user fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (newPassword) updateData.password = newPassword;

    // Update user
    await user.update(updateData);

    // Fetch updated user data (without password)
    const updatedUser = await User.findByPk(userId, {
      attributes: [
        'id',
        'email',
        'name',
        'phone',
        'role',
        'accountType',
        'subscriptionTier',
        'isPaid',
        'isApproved',
        'createdAt'
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};


