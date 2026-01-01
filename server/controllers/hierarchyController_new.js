// server/controllers/hierarchyController.js
const { User, Group, GroupMember, Invitation, Subscription } = require('../models/associations');

// ============================================
// MEMBER SECURITY MANAGEMENT (Leader only)
// ============================================

// @desc    Get member's security profiles
// @route   GET /api/hierarchy/members/:memberId/profiles
// @access  Private (Leader only)
const getMemberProfiles = async (req, res) => {
    try {
        const { memberId } = req.params;

        // Verify the member belongs to one of the leader's groups
        const memberRecord = await GroupMember.findOne({
            where: { userId: memberId },
            include: [{
                model: Group,
                where: { leaderId: req.user.id },
                required: true
            }]
        });

        if (!memberRecord) {
            return res.status(403).json({
                success: false,
                message: 'You can only view profiles of your group members'
            });
        }

        // Get member's profiles
        const Profile = require('../models/Profile');
        const profiles = await Profile.findAll({
            where: { userId: memberId },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            profiles
        });
    } catch (error) {
        console.error('Get member profiles error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving member profiles'
        });
    }
};

// @desc    Update member's security profile
// @route   PUT /api/hierarchy/members/:memberId/profiles/:profileId
// @access  Private (Leader only)
const updateMemberProfile = async (req, res) => {
    try {
        const { memberId, profileId } = req.params;
        const updates = req.body;

        // Verify the member belongs to one of the leader's groups
        const memberRecord = await GroupMember.findOne({
            where: { userId: memberId },
            include: [{
                model: Group,
                where: { leaderId: req.user.id },
                required: true
            }]
        });

        if (!memberRecord) {
            return res.status(403).json({
                success: false,
                message: 'You can only update profiles of your group members'
            });
        }

        // Update the profile
        const Profile = require('../models/Profile');
        const [updatedRows] = await Profile.update(updates, {
            where: { id: profileId, userId: memberId }
        });

        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Get updated profile
        const updatedProfile = await Profile.findByPk(profileId);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (error) {
        console.error('Update member profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating member profile'
        });
    }
};

// @desc    Get member's firewall rules
// @route   GET /api/hierarchy/members/:memberId/firewall
// @access  Private (Leader only)
const getMemberFirewallRules = async (req, res) => {
    try {
        const { memberId } = req.params;

        // Verify the member belongs to one of the leader's groups
        const memberRecord = await GroupMember.findOne({
            where: { userId: memberId },
            include: [{
                model: Group,
                where: { leaderId: req.user.id },
                required: true
            }]
        });

        if (!memberRecord) {
            return res.status(403).json({
                success: false,
                message: 'You can only view firewall rules of your group members'
            });
        }

        // Get member's firewall rules
        const FirewallRule = require('../models/FirewallRule');
        const rules = await FirewallRule.findAll({
            where: { userId: memberId },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            rules
        });
    } catch (error) {
        console.error('Get member firewall rules error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving member firewall rules'
        });
    }
};

// @desc    Update member's firewall rule
// @route   PUT /api/hierarchy/members/:memberId/firewall/:ruleId
// @access  Private (Leader only)
const updateMemberFirewallRule = async (req, res) => {
    try {
        const { memberId, ruleId } = req.params;
        const updates = req.body;

        // Verify the member belongs to one of the leader's groups
        const memberRecord = await GroupMember.findOne({
            where: { userId: memberId },
            include: [{
                model: Group,
                where: { leaderId: req.user.id },
                required: true
            }]
        });

        if (!memberRecord) {
            return res.status(403).json({
                success: false,
                message: 'You can only update firewall rules of your group members'
            });
        }

        // Update the firewall rule
        const FirewallRule = require('../models/FirewallRule');
        const [updatedRows] = await FirewallRule.update(updates, {
            where: { id: ruleId, userId: memberId }
        });

        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Firewall rule not found'
            });
        }

        // Get updated rule
        const updatedRule = await FirewallRule.findByPk(ruleId);

        res.json({
            success: true,
            message: 'Firewall rule updated successfully',
            rule: updatedRule
        });
    } catch (error) {
        console.error('Update member firewall rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating member firewall rule'
        });
    }
};

// @desc    Get member's VPN configurations
// @route   GET /api/hierarchy/members/:memberId/vpn
// @access  Private (Leader only)
const getMemberVPNConfigs = async (req, res) => {
    try {
        const { memberId } = req.params;

        // Verify the member belongs to one of the leader's groups
        const memberRecord = await GroupMember.findOne({
            where: { userId: memberId },
            include: [{
                model: Group,
                where: { leaderId: req.user.id },
                required: true
            }]
        });

        if (!memberRecord) {
            return res.status(403).json({
                success: false,
                message: 'You can only view VPN configs of your group members'
            });
        }

        // Get member's VPN configs
        const VpnConfig = require('../models/VpnConfig');
        const configs = await VpnConfig.findAll({
            where: { userId: memberId },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            configs
        });
    } catch (error) {
        console.error('Get member VPN configs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving member VPN configurations'
        });
    }
};

// @desc    Update member's VPN configuration
// @route   PUT /api/hierarchy/members/:memberId/vpn/:configId
// @access  Private (Leader only)
const updateMemberVPNConfig = async (req, res) => {
    try {
        const { memberId, configId } = req.params;
        const updates = req.body;

        // Verify the member belongs to one of the leader's groups
        const memberRecord = await GroupMember.findOne({
            where: { userId: memberId },
            include: [{
                model: Group,
                where: { leaderId: req.user.id },
                required: true
            }]
        });

        if (!memberRecord) {
            return res.status(403).json({
                success: false,
                message: 'You can only update VPN configs of your group members'
            });
        }

        // Update the VPN config
        const VpnConfig = require('../models/VpnConfig');
        const [updatedRows] = await VpnConfig.update(updates, {
            where: { id: configId, userId: memberId }
        });

        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        // Get updated config
        const updatedConfig = await VpnConfig.findByPk(configId);

        res.json({
            success: true,
            message: 'VPN configuration updated successfully',
            config: updatedConfig
        });
    } catch (error) {
        console.error('Update member VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating member VPN configuration'
        });
    }
};

module.exports = {
    getMemberProfiles,
    updateMemberProfile,
    getMemberFirewallRules,
    updateMemberFirewallRule,
    getMemberVPNConfigs,
    updateMemberVPNConfig
};

