// server/models/Group.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const Group = sequelize.define('Group', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    leaderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    maxMembers: {
        type: DataTypes.INTEGER,
        defaultValue: 10, // Can be increased based on payment tier
        allowNull: false
    }
}, {
    tableName: 'groups',
    timestamps: true
});

module.exports = Group;



