const express = require('express');
const router = express.Router();
const { getAuditLogs, exportAuditLogs } = require('../controllers/auditController');
const { protect, admin } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(admin);

router.get('/', getAuditLogs);
router.post('/export', exportAuditLogs);

module.exports = router;

