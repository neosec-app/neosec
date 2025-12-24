const Notification = require('../models/Notification');
const {
    sendVpnDownNotification,
    sendThreatDetectedNotification,
    sendCriticalAlertNotification,
    sendCertificateWarning,
    sendFirewallError,
    sendLogExportReady,
    sendGenericNotification
} = require('../services/emailService');

/**
 * Create notification and optionally send email
 */
const createNotification = async (userId, notificationData, sendEmail = true) => {
    try {
        // Create notification in database
        const notification = await Notification.create({
            userId,
            ...notificationData,
            status: 'unread'
        });

        // Send email if requested and priority is high/critical
        if (sendEmail && ['high', 'critical'].includes(notificationData.priority)) {
            console.log(`📧 Attempting to send email for ${notificationData.eventType} (priority: ${notificationData.priority})`);

            const User = require('../models/User');
            const user = await User.findByPk(userId);

            if (user && user.email) {
                console.log(`👤 Found user: ${user.email} (ID: ${userId})`);
                let emailResult;

                switch (notificationData.eventType) {
                    case 'vpn_tunnel_down':
                    case 'vpn_error':
                        emailResult = await sendVpnDownNotification(user, notificationData.eventLog || {});
                        break;

                    case 'certificate_expiring':
                        emailResult = await sendCertificateWarning(user, notificationData.eventLog || {});
                        break;

                    case 'firewall_error':
                        emailResult = await sendFirewallError(user, notificationData.eventLog || {});
                        break;

                    case 'security_alert':
                    case 'threat_blocked':
                    case 'critical_threat_detected':
                        emailResult = await sendThreatDetectedNotification(user, notificationData.eventLog || {});
                        break;

                    case 'system_error':
                    case 'scheduled_profile_failed':
                        emailResult = await sendCriticalAlertNotification(user, {
                            title: notificationData.title,
                            message: notificationData.message
                        });
                        break;

                    case 'log_export_ready':
                        emailResult = await sendLogExportReady(user, notificationData.eventLog || {});
                        break;

                    default:
                        emailResult = await sendGenericNotification(user, {
                            title: notificationData.title,
                            message: notificationData.message,
                            eventType: notificationData.eventType
                        });
                }

                // Update notification with email status
                if (emailResult) {
                    console.log(`📧 Email result for ${notificationData.eventType}: ${emailResult.success ? '✅ SUCCESS' : '❌ FAILED'} - ${emailResult.error || 'No error'}`);
                    await notification.update({
                        emailSent: emailResult.success,
                        emailRecipients: JSON.stringify([user.email])
                    });
                } else {
                    console.log(`📧 No email result returned for ${notificationData.eventType}`);
                }
            } else {
                console.log(`❌ User not found or no email for userId: ${userId}, user:`, user);
            }
        }

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

module.exports = {
    createNotification
};
