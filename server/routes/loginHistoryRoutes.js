const express = require('express');
const router = express.Router();
const {
  getLoginHistory,
  getSecurityEvents,
  toggleUserLock
} = require('../controllers/loginHistoryController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getLoginHistory);
router.get('/security-events', getSecurityEvents);
router.put('/user/:userId/lock', admin, toggleUserLock);

module.exports = router;

