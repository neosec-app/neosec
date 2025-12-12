const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // First user becomes admin
        const userCount = await User.count();
        const isFirstUser = userCount === 0;

        const user = await User.create({
            email,
            password,
            isApproved: true,
            role: isFirstUser ? 'admin' : 'user',
            accountType: isFirstUser ? 'admin' : 'user',
            subscriptionTier: 'free',
            isPaid: false
        });

        res.status(201).json({
            success: true,
            message: isFirstUser
                ? 'Registration successful. Admin account created.'
                : 'Registration successful. Please login.'
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
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

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Approval check
        if (!user.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Account pending approval'
            });
        }

        // Generate token
        const token = generateToken(user.id);

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
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

/**
 * @desc    Get current logged-in user (fresh from DB)
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        // req.user is already populated by protect middleware
        const user = await User.findByPk(req.user.id, {
            attributes: [
                'id',
                'email',
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
        console.error('GetMe error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};


