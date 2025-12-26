// server/models/GroupMember.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const GroupMember = sequelize.define('GroupMember', {
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
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'removed'),
        defaultValue: 'pending',
        allowNull: false
    },
    joinedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    invitedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Leader can override member's configs
    canLeaderManageConfigs: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'group_members',
    timestamps: true,
    underscored: false, // Disable underscored since database uses camelCase columns
    indexes: [
        {
            unique: true,
            fields: ['groupId', 'userId']
        }
    ]
});

module.exports = GroupMember;