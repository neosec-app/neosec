const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications for current user (or all if admin)
exports.getNotifications = async (req, res) => {
    try {
        const { status, priority, userId } = req.query;

        const whereClause = {};
        
        // Admins can view all notifications or filter by userId
        if (req.user.role === 'admin' && userId) {
            whereClause.userId = userId;
        } else if (req.user.role !== 'admin') {
            // Regular users only see their own notifications
            whereClause.userId = req.user.id;
        }
        // If admin and no userId specified, show all notifications

        if (status) {
            whereClause.status = status;
        }

        if (priority) {
            whereClause.priority = priority;
        }

        const notifications = await Notification.findAll({
            where: whereClause,
            include: [
                {
                    model: require('../models/User'),
                    as: 'user',
                    attributes: ['id', 'email'],
                    required: false
                }
            ],
            order: [
                ['priority', 'DESC'], // Critical first
                ['createdAt', 'DESC']
            ]
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

// Create notification
exports.createNotification = async (req, res) => {
    try {
        const {
            title,
            message,
            eventType,
            priority,
            emailRecipients,
            eventLog,
            userId
        } = req.body;

        // Validation
        if (!title || !message || !eventType) {
            return res.status(400).json({
                success: false,
                message: 'Title, message, and eventType are required'
            });
        }

        // Determine target user
        const targetUserId = userId || req.user.id;

        // Only admins can send notifications to other users
        if (userId && userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can send notifications to other users'
            });
        }

        // Check for duplicate notifications (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const duplicateNotification = await Notification.findOne({
            where: {
                userId: targetUserId,
                title,
                eventType,
                createdAt: {
                    [require('sequelize').Op.gte]: fiveMinutesAgo
                }
            }
        });

        if (duplicateNotification) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate notification filtered (sent within last 5 minutes)'
            });
        }

        // Create notification
        const notification = await Notification.create({
            title,
            message,
            eventType,
            priority: priority || 'medium',
            emailRecipients: emailRecipients ? JSON.stringify(emailRecipients) : null,
            eventLog,
            userId: targetUserId,
            emailSent: false
        });

        // Log to console for demo purposes
        console.log('🔔 NEW NOTIFICATION CREATED:');
        console.log(`   Title: ${title}`);
        console.log(`   Type: ${eventType}`);
        console.log(`   Priority: ${priority || 'medium'}`);
        console.log(`   User: ${req.user.email}`);
        console.log(`   Time: ${new Date().toISOString()}`);

        res.status(201).json({
            success: true,
            message: 'Notification created and stored in database',
            data: notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create notification'
        });
    }
};

// Simulate event-based notification (VPN tunnel down example)
exports.simulateVpnTunnelDown = async (req, res) => {
    try {
        const { serverName, siteId } = req.body;

        const notification = await Notification.create({
            title: 'WireGuard Tunnel Down',
            message: `WireGuard tunnel to ${serverName || 'Site A'} is Down`,
            eventType: 'vpn_tunnel_down',
            priority: 'critical',
            emailRecipients: JSON.stringify([
                'admin@gmail.com',
                'user1@hotmail.com',
                'user2@gmail.com'
            ]),
            eventLog: `WireGuard tunnel connection failed. Site: ${siteId || 'Site A'}. Last successful connection: ${new Date(Date.now() - 15 * 60 * 1000).toISOString()}`,
            userId: req.user.id,
            emailSent: false
        });

        console.log('🚨 CRITICAL ALERT: VPN Tunnel Down');

        res.status(201).json({
            success: true,
            message: 'VPN tunnel down notification created',
            data: notification
        });
    } catch (error) {
        console.error('Simulate VPN error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create VPN notification'
        });
    }
};

// Simulate certificate expiring notification
exports.simulateCertificateExpiring = async (req, res) => {
    try {
        const { certificateName, daysLeft } = req.body;

        const notification = await Notification.create({
            title: 'OpenVPN Certificate Expiring',
            message: `${certificateName || 'OpenVPN'} certificate will expire in ${daysLeft || 7} days`,
            eventType: 'certificate_expiring',
            priority: daysLeft <= 3 ? 'high' : 'medium',
            eventLog: `Certificate expiration warning. Certificate: ${certificateName}. Expires: ${new Date(Date.now() + (daysLeft || 7) * 24 * 60 * 60 * 1000).toISOString()}`,
            userId: req.user.id,
            emailSent: false
        });

        console.log('⚠️ REMINDER: Certificate Expiring');

        res.status(201).json({
            success: true,
            message: 'Certificate expiring notification created',
            data: notification
        });
    } catch (error) {
        console.error('Simulate certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create certificate notification'
        });
    }
};

// Simulate firewall error
exports.simulateFirewallError = async (req, res) => {
    try {
        const { errorMessage } = req.body;

        const notification = await Notification.create({
            title: 'Firewall Error',
            message: errorMessage || 'Critical firewall configuration error detected',
            eventType: 'firewall_error',
            priority: 'critical',
            eventLog: `Firewall error detected at ${new Date().toISOString()}. Error: ${errorMessage}`,
            userId: req.user.id,
            emailSent: false
        });

        console.log('🔥 CRITICAL: Firewall Error');

        res.status(201).json({
            success: true,
            message: 'Firewall error notification created',
            data: notification
        });
    } catch (error) {
        console.error('Simulate firewall error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create firewall notification'
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.update({ status: 'read' });

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.destroy();

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        const stats = {
            total: await Notification.count({ where: { userId: req.user.id } }),
            unread: await Notification.count({
                where: { userId: req.user.id, status: 'unread' }
            }),
            critical: await Notification.count({
                where: { userId: req.user.id, priority: 'critical' }
            }),
            today: await Notification.count({
                where: {
                    userId: req.user.id,
                    createdAt: {
                        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            })
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification statistics'
        });
    }
};