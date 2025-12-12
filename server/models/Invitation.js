// server/models/Invitation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const Invitation = sequelize.define('Invitation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    groupId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'groups',
            key: 'id'
        }
    },
    inviterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    inviteeEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    inviteeId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
        defaultValue: 'pending',
        allowNull: false
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'invitations',
    timestamps: true
});

module.exports = Invitation;