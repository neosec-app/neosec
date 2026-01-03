// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');


// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // IMPORTANT: controllers expect req.user.id, accountType, isPaid, subscriptionTier, role
        const user = await User.findByPk(decoded.userId ?? decoded.id, {
            attributes: ['id', 'role', 'email', 'accountType', 'subscriptionTier', 'isPaid', 'isApproved'],
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Attach the FULL user object so controllers can use req.user.id etc.
        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
};




// Require admin role
const requireAdmin = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
};

// Require leader role (paid account)
const requireLeader = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized'
        });
    }

    // Check if user is a leader or admin
    if (req.user.accountType === 'leader' || req.user.role === 'admin') {
        // Verify they have an active subscription
        if (req.user.isPaid || req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Active subscription required. Please upgrade to leader account.'
            });
        }
    } else {
        return res.status(403).json({
            success: false,
            message: 'Leader privileges required. Please upgrade your account.'
        });
    }
};



const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            message: "Not authorized" 
        });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "BE CAREFUL" });
    }
    next();
};


module.exports = {
    protect,
    requireAdmin,
    requireLeader,
    admin,
};