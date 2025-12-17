const express = require('express');
const router = express.Router();
const {
  getStatus,
  getBlocklist,
  forceUpdate,
  getStats,
  updateSettings,
  exportBlocklist
} = require('../controllers/threatBlockerController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Threat blocker routes
router.get('/status', getStatus);
router.get('/blocklist', getBlocklist);
router.post('/force-update', forceUpdate);
router.get('/stats', getStats);
router.put('/settings', updateSettings);
router.get('/export', exportBlocklist);

module.exports = router;


