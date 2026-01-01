const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validations/authValidation');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Token validation endpoint for desktop app
router.get('/verify', protect, (req, res) => {
    res.json({
        success: true,
        email: req.user.email,
        role: req.user.accountType
    });
});

module.exports = router;

