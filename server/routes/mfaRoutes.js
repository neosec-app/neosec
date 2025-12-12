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

router.get('/:userId?', getMFASettings);
router.post('/setup', setupMFA);
router.post('/verify', verifyMFA);
router.post('/disable', disableMFA);

module.exports = router;

