const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const User = require('./User');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    eventType: {
        type: DataTypes.ENUM(
            'vpn_error',
            'vpn_tunnel_down',
            'firewall_error',
            'certificate_expiring',
            'rule_violation',
            'connection_failed',
            'security_alert'
        ),
        allowNull: false
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('unread', 'read', 'archived'),
        defaultValue: 'unread'
    },
    emailSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailRecipients: {
        type: DataTypes.TEXT, // Store as JSON string
        allowNull: true
    },
    eventLog: {
        type: DataTypes.TEXT, // Detailed event information
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    tableName: 'notifications'
});

// Association
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

module.exports = Notification;