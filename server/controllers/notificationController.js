const Notification = require('../models/Notification');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// Get all notifications for current user (or all if admin)
exports.getNotifications = async (req, res) => {
    try {
        // Check authentication
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        


        const { status, priority, userId } = req.query;

        const whereClause = {};
        
        // Check if user is admin (handle both role and accountType)
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.accountType === 'admin');
        
        // Admins can view all notifications or filter by userId
        if (isAdmin && userId) {
            whereClause.userId = userId;
        } else if (!isAdmin) {
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
                    model: User,
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
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                original: error.original?.message,
                code: error.original?.code,
                stack: error.stack
            } : undefined
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
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.accountType === 'admin');
        if (userId && userId !== req.user.id && !isAdmin) {
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

                // Create notification using helper (which handles email sending)
        const notification = await createNotification(targetUserId, {
            title,
            message,
            eventType,
            priority: priority || 'medium',
            emailRecipients: emailRecipients ? JSON.stringify(emailRecipients) : null,
            eventLog
        }, true);

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

// Generic notification simulation
exports.simulateNotification = async (req, res) => {
    try {
        const { message, priority = 'medium' } = req.body;

        // Validate inputs
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        if (!['low', 'medium', 'high', 'critical'].includes(priority.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Priority must be one of: low, medium, high, critical'
            });
        }

        const normalizedPriority = priority.toLowerCase();

        // Create appropriate notification based on priority
        let title, eventLog, consoleMessage;

        switch (normalizedPriority) {
            case 'critical':
                title = 'Critical System Alert';
                eventLog = `Critical alert: ${message}`;
                consoleMessage = '🚨 CRITICAL ALERT';
                break;
            case 'high':
                title = 'High Priority Alert';
                eventLog = `High priority alert: ${message}`;
                consoleMessage = '⚠️ HIGH PRIORITY ALERT';
                break;
            case 'medium':
                title = 'System Notification';
                eventLog = `System notification: ${message}`;
                consoleMessage = 'ℹ️ SYSTEM NOTIFICATION';
                break;
            case 'low':
                title = 'Information';
                eventLog = `Information: ${message}`;
                consoleMessage = '📝 INFORMATION';
                break;
        }

        const notification = await createNotification(req.user.id, {
            title,
            message,
            eventType: 'generic_notification',
            priority: normalizedPriority,
            eventLog
        }, true);

        console.log(consoleMessage);

        res.status(201).json({
            success: true,
            message: 'Notification created and email sent',
            data: notification
        });
    } catch (error) {
        console.error('Simulate notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
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

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const whereClause = { userId: req.user.id, status: 'unread' };

        // Admins can mark all for a specific user if userId is provided
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.accountType === 'admin');
        if (isAdmin && req.body.userId) {
            whereClause.userId = req.body.userId;
        }

        const result = await Notification.update(
            { status: 'read' },
            { where: whereClause }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            updated: result[0]
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
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