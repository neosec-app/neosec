const express = require('express');
const router = express.Router();
const {
    getNotifications,
    createNotification,
    simulateNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Main notification routes
router.get('/', getNotifications);                           // Get all notifications
router.post('/', createNotification);                        // Create notification (MAIN API)
router.get('/stats', getNotificationStats);                  // Get statistics
router.patch('/:id/read', markAsRead);                       // Mark as read
router.patch('/mark-all-read', markAllAsRead);              // Mark all as read
router.delete('/:id', deleteNotification);                   // Delete

// Simulation route (for demo purposes)
router.post('/simulate', simulateNotification);                     // Generic notification simulation

module.exports = router;