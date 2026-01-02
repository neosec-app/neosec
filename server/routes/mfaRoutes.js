const express = require('express');
const router = express.Router();
const {
  getMFASettings,
  setupMFA,
  verifyMFA,
  disableMFA
} = require('../controllers/mfaController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Specific routes first
router.post('/setup', setupMFA);
router.post('/verify', verifyMFA);
router.post('/disable', disableMFA);
// Generic route last (with optional userId parameter)
router.get('/', getMFASettings);
router.get('/:userId', getMFASettings);

module.exports = router;

