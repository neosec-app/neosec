const VpnConfig = require('../models/VpnConfig');

// Get all VPN configs for current user
exports.getVpnConfigs = async (req, res) => {
    try {
        const vpnConfigs = await VpnConfig.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: vpnConfigs.length,
            data: vpnConfigs
        });
    } catch (error) {
        console.error('Get VPN configs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch VPN configurations'
        });
    }
};

// Get single VPN config
exports.getVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        res.status(200).json({
            success: true,
            data: vpnConfig
        });
    } catch (error) {
        console.error('Get VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch VPN configuration'
        });
    }
};

// Create new VPN config
exports.createVpnConfig = async (req, res) => {
    try {
        const { name, serverAddress, port, protocol, username, password, description } = req.body;

        const vpnConfig = await VpnConfig.create({
            name,
            serverAddress,
            port,
            protocol,
            username,
            password,
            description,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'VPN configuration created successfully',
            data: vpnConfig
        });
    } catch (error) {
        console.error('Create VPN config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create VPN configuration'
        });
    }
};

// Update VPN config
exports.updateVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        const { name, serverAddress, port, protocol, username, password, description, isActive } = req.body;

        await vpnConfig.update({
            name: name !== undefined ? name : vpnConfig.name,
            serverAddress: serverAddress !== undefined ? serverAddress : vpnConfig.serverAddress,
            port: port !== undefined ? port : vpnConfig.port,
            protocol: protocol !== undefined ? protocol : vpnConfig.protocol,
            username: username !== undefined ? username : vpnConfig.username,
            password: password !== undefined ? password : vpnConfig.password,
            description: description !== undefined ? description : vpnConfig.description,
            isActive: isActive !== undefined ? isActive : vpnConfig.isActive
        });

        res.status(200).json({
            success: true,
            message: 'VPN configuration updated successfully',
            data: vpnConfig
        });
    } catch (error) {
        console.error('Update VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update VPN configuration'
        });
    }
};

// Delete VPN config
exports.deleteVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        await vpnConfig.destroy();

        res.status(200).json({
            success: true,
            message: 'VPN configuration deleted successfully'
        });
    } catch (error) {
        console.error('Delete VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete VPN configuration'
        });
    }
};

// Toggle VPN config active status
exports.toggleVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        await vpnConfig.update({
            isActive: !vpnConfig.isActive
        });

        res.status(200).json({
            success: true,
            message: `VPN configuration ${vpnConfig.isActive ? 'activated' : 'deactivated'} successfully`,
            data: vpnConfig
        });
    } catch (error) {
        console.error('Toggle VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle VPN configuration'
        });
    }
};