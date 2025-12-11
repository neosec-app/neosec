const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); 
const scan = require('../controllers/scanController');

router.post('/url', protect, scan.scanUrl);
router.get('/status/:scanId', protect, scan.getScanStatus);
router.get('/history', protect, scan.getScanHistory);

module.exports = router;
