const express = require('express');
const router = express.Router();
const {
  getStatus,
  getBlocklist,
  forceUpdate,
  getStats,
  updateSettings,
  exportBlocklist,
  testThreatBlocker
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
router.post('/test', testThreatBlocker); // Test endpoint to simulate a blocked threat

module.exports = router;


