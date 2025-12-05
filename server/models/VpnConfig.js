const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const User = require('./User');

const VpnConfig = sequelize.define('VpnConfig', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    serverAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    port: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 65535
        }
    },
    protocol: {
        type: DataTypes.ENUM('OpenVPN', 'WireGuard', 'IKEv2', 'L2TP'),
        allowNull: false,
        defaultValue: 'OpenVPN'
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
    tableName: 'vpn_configs'
});

// Define association
VpnConfig.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(VpnConfig, { foreignKey: 'userId', as: 'vpnConfigs' });

module.exports = VpnConfig;