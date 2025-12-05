const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Protected routes
router.get('/', protect, getDashboard);

module.exports = router;

