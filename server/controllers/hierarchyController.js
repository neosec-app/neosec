// server/controllers/hierarchyController.js
const { User, Group, GroupMember, Invitation, Subscription } = require('../models/associations');

// ============================================
// GROUP MANAGEMENT
// ============================================

// @desc    Create a new group
// @route   POST /api/hierarchy/groups
// @access  Private (Leader only)
const createGroup = async (req, res) => {
    try {
        const { name, description, maxMembers } = req.body;

        // Validate input
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Group name is required'
            });
        }

        // Check if user already has max groups based on their tier
        const existingGroups = await Group.count({
            where: { leaderId: req.user.id, isActive: true }
        });

        const maxGroupsAllowed = getMaxGroupsForTier(req.user.subscriptionTier);
        if (existingGroups >= maxGroupsAllowed) {
            return res.status(403).json({
                success: false,
                message: `You have reached the maximum number of groups (${maxGroupsAllowed}) for your subscription tier.`
            });
        }

        // Create group
        const group = await Group.create({
            name,
            description,
            leaderId: req.user.id,
            maxMembers: maxMembers || 10
        });

        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            group
        });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating group',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Invite a user to join group
// @route   POST /api/hierarchy/groups/:groupId/invite
// @access  Private (Leader only)
const inviteMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { email } = req.body;

        console.log('Invite member request:', { groupId, email, userId: req.user.id });

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if group exists and user is leader
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (group.leaderId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only group leaders can send invitations'
            });
        }

        // Check if user is trying to invite themselves
        if (email === req.user.email) {
            return res.status(400).json({
                success: false,
                message: 'You cannot invite yourself to the group'
            });
        }

        // Find the user by email (optional - user might not exist yet)
        const UserModel = require('../models/User');
        const invitee = await UserModel.findOne({ where: { email } });

        // Check if the invitee is already a member of this group
        if (invitee) {
            const existingMember = await GroupMember.findOne({
                where: { groupId, userId: invitee.id }
            });

            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message: 'This user is already a member of the group'
                });
            }

            // Check if invitation already exists
            const existingInvitation = await Invitation.findOne({
                where: {
                    groupId,
                    inviteeId: invitee.id,
                    status: 'pending'
                }
            });

            if (existingInvitation) {
                return res.status(400).json({
                    success: false,
                    message: 'Invitation already sent to this user'
                });
            }
        } else {
            // Check if invitation already exists by email for non-registered users
            const existingInvitation = await Invitation.findOne({
                where: {
                    groupId,
                    inviteeEmail: email,
                    status: 'pending'
                }
            });

            if (existingInvitation) {
                return res.status(400).json({
                    success: false,
                    message: 'Invitation already sent to this email'
                });
            }
        }

        // Generate a unique token for the invitation
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        // Create invitation
        const invitationData = {
            groupId,
            inviterId: req.user.id,
            inviteeEmail: email,
            inviteeId: invitee ? invitee.id : null,
            status: 'pending',
            token: token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        console.log('Creating invitation with data:', invitationData);

        const invitation = await Invitation.create(invitationData);

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            invitation
        });

    } catch (error) {
        console.error('Invite member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending invitation'
        });
    }
};

// @desc    Get all groups led by current user
// @route   GET /api/hierarchy/groups/my-groups
// @access  Private (Leader only)
const getMyGroups = async (req, res) => {
    try {
        const groups = await Group.findAll({
            where: { leaderId: req.user.id },
            include: [
                {
                    model: GroupMember,
                    as: 'members',
                    where: { status: 'accepted' },
                    required: false,
                    include: [{ model: User, as: 'user' }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            groups
        });
    } catch (error) {
        console.error('Get my groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching groups'
        });
    }
};

// @desc    Get all members of a group
// @route   GET /api/hierarchy/groups/:groupId/members
// @access  Private
const getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findByPk(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is leader or member
        const isLeader = group.leaderId === req.user.id;
        const isMember = await GroupMember.findOne({
            where: {
                groupId,
                userId: req.user.id,
                status: 'accepted'
            }
        });

        if (!isLeader && !isMember && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const members = await GroupMember.findAll({
            where: { groupId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'accountType']
                }
            ],
            order: [['joinedAt', 'ASC']]
        });

        res.status(200).json({
            success: true,
            count: members.length,
            members
        });
    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching members'
        });
    }
};

const getMyGroupMembers = async (req, res) => {
    try {
        // Get all groups led by this user
        const groups = await Group.findAll({
            where: { leaderId: req.user.id },
            include: [{
                model: GroupMember,
                as: 'members',
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'name', 'phone', 'accountType']
                }]
            }]
        });

        // Collect all unique members
        const memberMap = new Map();
        groups.forEach(group => {
            group.members?.forEach(member => {
                if (!memberMap.has(member.user.id)) {
                    memberMap.set(member.user.id, {
                        id: member.user.id,
                        email: member.user.email,
                        name: member.user.name,
                        phone: member.user.phone,
                        accountType: member.user.accountType,
                        joinedAt: member.createdAt,
                        groupName: group.name
                    });
                }
            });
        });

        const members = Array.from(memberMap.values());

        res.json({
            success: true,
            data: members
        });
    } catch (error) {
        console.error('Error getting my group members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get group members'
        });
    }
};

// ============================================
// INVITATION MANAGEMENT
// ============================================

// @desc    Accept invitation
// @route   POST /api/hierarchy/invitations/:invitationId/accept
// @access  Private
const acceptInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;

        console.log('Accept invitation request:', { invitationId, userId: req.user.id, userEmail: req.user.email });

        const invitation = await Invitation.findByPk(invitationId);
        console.log('Found invitation:', invitation ? {
            id: invitation.id,
            inviteeId: invitation.inviteeId,
            inviteeEmail: invitation.inviteeEmail,
            status: invitation.status,
            groupId: invitation.groupId
        } : 'null');

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }

        // Check if user can accept this invitation
        // For registered users: inviteeId should match user ID
        // For email-based invitations: check if invitation email matches user email
        const canAccept = invitation.inviteeId === req.user.id ||
                          (invitation.inviteeId === null && invitation.inviteeEmail === req.user.email);

        console.log('Permission check:', {
            inviteeId: invitation.inviteeId,
            userId: req.user.id,
            inviteeEmail: invitation.inviteeEmail,
            userEmail: req.user.email,
            canAccept
        });

        if (!canAccept) {
            console.log('Permission denied for invitation acceptance');
            return res.status(403).json({
                success: false,
                message: 'You can only accept invitations sent to your email'
            });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Invitation is no longer pending'
            });
        }

        // Check if user is already a member
        const existingMembership = await GroupMember.findOne({
            where: {
                groupId: invitation.groupId,
                userId: req.user.id
            }
        });

        if (existingMembership) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this group'
            });
        }

        // Add user to group
        await GroupMember.create({
            groupId: invitation.groupId,
            userId: req.user.id,
            invitedBy: invitation.inviterId,
            role: 'member',
            status: 'accepted',
            joinedAt: new Date()
        });

        // Update invitation status
        invitation.status = 'accepted';
        await invitation.save();

        res.status(200).json({
            success: true,
            message: 'Invitation accepted successfully'
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error accepting invitation',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Reject invitation
// @route   POST /api/hierarchy/invitations/:invitationId/reject
// @access  Private
const rejectInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;

        const invitation = await Invitation.findByPk(invitationId);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }

        // Check if user can reject this invitation
        // For registered users: inviteeId should match user ID
        // For email-based invitations: check if invitation email matches user email
        const canReject = invitation.inviteeId === req.user.id ||
                          (invitation.inviteeId === null && invitation.inviteeEmail === req.user.email);

        if (!canReject) {
            return res.status(403).json({
                success: false,
                message: 'You can only reject invitations sent to your email'
            });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Invitation is no longer pending'
            });
        }

        // Update invitation status
        invitation.status = 'rejected';
        await invitation.save();

        res.status(200).json({
            success: true,
            message: 'Invitation rejected successfully'
        });
    } catch (error) {
        console.error('Reject invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting invitation',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Leave a group (remove membership)
// @route   POST /api/hierarchy/memberships/:membershipId/leave
// @access  Private
const leaveGroup = async (req, res) => {
    try {
        const { membershipId } = req.params;

        // Find the membership
        const membership = await GroupMember.findByPk(membershipId);

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found'
            });
        }

        // Check if user owns this membership
        if (membership.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only leave groups you are a member of'
            });
        }

        // Check if user is the leader of the group (leaders can't leave)
        const group = await Group.findByPk(membership.groupId);
        if (group && group.leaderId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Group leaders cannot leave their own groups. Transfer leadership first or delete the group.'
            });
        }

        // Delete the membership
        await membership.destroy();

        res.status(200).json({
            success: true,
            message: 'Successfully left the group'
        });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({
            success: false,
            message: 'Error leaving group',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all invitations received by current user
// @route   GET /api/hierarchy/invitations
// @access  Private
const getMyInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.findAll({
            where: {
                inviteeId: req.user.id,
                status: 'pending'
            },
            include: [
                {
                    model: Group,
                    as: 'group'
                },
                {
                    model: User,
                    as: 'inviter'
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            invitations
        });
    } catch (error) {
        console.error('Get my invitations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invitations'
        });
    }
};

// ============================================
// MEMBERSHIP MANAGEMENT
// ============================================

// @desc    Get all groups current user is a member of
// @route   GET /api/hierarchy/memberships
// @access  Private
const getMyMemberships = async (req, res) => {
    try {
        const memberships = await GroupMember.findAll({
            where: {
                userId: req.user.id,
                status: 'accepted'
            },
            include: [
                {
                    model: Group,
                    as: 'group',
                    include: [
                        {
                            model: GroupMember,
                            as: 'members',
                            where: { status: 'accepted' },
                            required: false
                        }
                    ]
                }
            ],
            order: [['joinedAt', 'DESC']]
        });

        res.json({
            success: true,
            memberships
        });
    } catch (error) {
        console.error('Get my memberships error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching memberships'
        });
    }
};

// ============================================
// MEMBER SECURITY MANAGEMENT (Leader only)
// ============================================

// @desc    Get member's security profiles
// @route   GET /api/hierarchy/members/:memberId/profiles
// @access  Private (Leader only)
const getMemberProfiles = async (req, res) => {
    try {
        const { memberId } = req.params;
        console.log('getMemberProfiles called for memberId:', memberId, 'by user:', req.user.id);

        // Verify the member belongs to one of the leader's groups
        // First get the leader's groups
        const leaderGroups = await Group.findAll({
            where: { leaderId: req.user.id },
            attributes: ['id']
        });

        const groupIds = leaderGroups.map(g => g.id);

        // Check if member belongs to any of these groups
        const memberRecord = await GroupMember.findOne({
            where: {
                userId: memberId,
                groupId: { [require('sequelize').Op.in]: groupIds }
            }
        });

        console.log('Member record check:', {
            memberId,
            leaderId: req.user.id,
            leaderGroups: groupIds.length,
            memberRecord: memberRecord ? 'found' : 'not found'
        });

        if (!memberRecord) {
            console.log('Permission denied: member does not belong to leader\'s groups');
            return res.status(403).json({
                success: false,
                message: 'You can only view profiles of your group members'
            });
        }

        // Get member's profiles
        // Temporarily return empty array to test
        res.json({
            success: true,
            profiles: []
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
        // First get the leader's groups
        const leaderGroups = await Group.findAll({
            where: { leaderId: req.user.id },
            attributes: ['id']
        });

        const groupIds = leaderGroups.map(g => g.id);

        // Check if member belongs to any of these groups
        const memberRecord = await GroupMember.findOne({
            where: {
                userId: memberId,
                groupId: { [require('sequelize').Op.in]: groupIds }
            }
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
        // First get the leader's groups
        const leaderGroups = await Group.findAll({
            where: { leaderId: req.user.id },
            attributes: ['id']
        });

        const groupIds = leaderGroups.map(g => g.id);

        // Check if member belongs to any of these groups
        const memberRecord = await GroupMember.findOne({
            where: {
                userId: memberId,
                groupId: { [require('sequelize').Op.in]: groupIds }
            }
        });

        if (!memberRecord) {
            return res.status(403).json({
                success: false,
                message: 'You can only view firewall rules of your group members'
            });
        }

        // Get member's firewall rules
        // Temporarily return empty array to test
        res.json({
            success: true,
            rules: []
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
        // First get the leader's groups
        const leaderGroups = await Group.findAll({
            where: { leaderId: req.user.id },
            attributes: ['id']
        });

        const groupIds = leaderGroups.map(g => g.id);

        // Check if member belongs to any of these groups
        const memberRecord = await GroupMember.findOne({
            where: {
                userId: memberId,
                groupId: { [require('sequelize').Op.in]: groupIds }
            }
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
        // First get the leader's groups
        const leaderGroups = await Group.findAll({
            where: { leaderId: req.user.id },
            attributes: ['id']
        });

        const groupIds = leaderGroups.map(g => g.id);

        // Check if member belongs to any of these groups
        const memberRecord = await GroupMember.findOne({
            where: {
                userId: memberId,
                groupId: { [require('sequelize').Op.in]: groupIds }
            }
        });

        if (!memberRecord) {
            return res.status(403).json({
                success: false,
                message: 'You can only view VPN configs of your group members'
            });
        }

        // Get member's VPN configs
        // Temporarily return empty array to test
        res.json({
            success: true,
            configs: []
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
        // First get the leader's groups
        const leaderGroups = await Group.findAll({
            where: { leaderId: req.user.id },
            attributes: ['id']
        });

        const groupIds = leaderGroups.map(g => g.id);

        // Check if member belongs to any of these groups
        const memberRecord = await GroupMember.findOne({
            where: {
                userId: memberId,
                groupId: { [require('sequelize').Op.in]: groupIds }
            }
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
    // Group management
    createGroup,
    inviteMember,
    getMyGroups,
    getGroupMembers,
    getMyGroupMembers,

    // Invitation management
    getMyInvitations,
    acceptInvitation,
    rejectInvitation,

    // Membership management
    getMyMemberships,
    leaveGroup,

    // Member security management
    getMemberProfiles,
    updateMemberProfile,
    getMemberFirewallRules,
    updateMemberFirewallRule,
    getMemberVPNConfigs,
    updateMemberVPNConfig
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getMaxGroupsForTier = (tier) => {
    const limits = {
        free: 0,
        basic: 1,
        pro: 5,
        enterprise: 999
    };
    return limits[tier] || 0;
};
