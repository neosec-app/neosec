const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  getUserDevices,
  registerDevice,
  updateDeviceStatus
} = require('../controllers/deviceController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Admin routes
router.get('/all', admin, getAllDevices);
router.get('/user/:userId', getUserDevices);
router.post('/register', registerDevice);
router.put('/:deviceId/status', updateDeviceStatus);

module.exports = router;

