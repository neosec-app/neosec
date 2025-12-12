const express = require('express');
const router = express.Router();
const {
  getSystemHealth,
  getAPIPerformance,
  getServerResources,
  getVPNUptime,
  getFirewallSyncData
} = require('../controllers/systemHealthController');
const { protect, admin } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(admin);

router.get('/health', getSystemHealth);
router.get('/api-performance', getAPIPerformance);
router.get('/server-resources', getServerResources);
router.get('/vpn-uptime', getVPNUptime);
router.get('/firewall-sync', getFirewallSyncData);

module.exports = router;

