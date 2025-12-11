const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { updateDataTransfer, getDataTransferStats } = require('../controllers/dataTransferController');

// All routes require authentication
router.use(protect);

// Update data transfer for active session
router.post('/update', updateDataTransfer);

// Get data transfer statistics
router.get('/stats', getDataTransferStats);

module.exports = router;

