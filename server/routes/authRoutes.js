const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe
} = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validations/authValidation');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;

