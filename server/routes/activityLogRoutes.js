const express = require('express');
const router = express.Router();
const {
  getLogs,
  getLogById,
  exportLogs
} = require('../controllers/activityLogController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Activity log routes
router.get('/', getLogs);
router.get('/:id', getLogById);
router.post('/export', exportLogs);

module.exports = router;


