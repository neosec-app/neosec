// server/models/Subscription.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const Subscription = sequelize.define('Subscription', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    tier: {
        type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
        defaultValue: 'free',
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'canceled', 'expired', 'pending'),
        defaultValue: 'pending',
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    autoRenew: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Payment gateway transaction ID
    transactionId: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'subscriptions',
    timestamps: true
});

module.exports = Subscription;
