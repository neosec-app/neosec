const express = require('express');
const router = express.Router();
const {
    getNotifications,
    createNotification,
    simulateVpnTunnelDown,
    simulateCertificateExpiring,
    simulateFirewallError,
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

// Simulation routes (for demo purposes)
router.post('/simulate/vpn-down', simulateVpnTunnelDown);           // Simulate VPN down
router.post('/simulate/cert-expiring', simulateCertificateExpiring); // Simulate cert expiring
router.post('/simulate/firewall-error', simulateFirewallError);     // Simulate firewall error

module.exports = router;