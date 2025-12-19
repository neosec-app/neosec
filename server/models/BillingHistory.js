const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const BillingHistory = sequelize.define('BillingHistory', {
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
    subscriptionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'subscriptions',
            key: 'id'
        }
    },
    plan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('paid', 'pending', 'failed', 'refunded'),
        defaultValue: 'paid',
        allowNull: false
    },
    paidAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    stripeInvoiceId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    stripePaymentIntentId: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'billing_history',
    timestamps: true
});

module.exports = BillingHistory;