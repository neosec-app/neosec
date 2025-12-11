// server/controllers/hierarchyController.js
const { User, Group, GroupMember, Invitation, Subscription } = require('../models/associations');
const crypto = require('crypto');
const { Op } = require('sequelize');

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
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'email', 'accountType']
                        }
                    ],
                    where: { status: 'accepted' },
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: groups.length,
            groups
        });
    } catch (error) {
        console.error('Get my groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching groups',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get specific group details
// @route   GET /api/hierarchy/groups/:groupId
// @access  Private
const getGroupDetails = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findByPk(groupId, {
            include: [
                {
                    model: User,
                    as: 'leader',
                    attributes: ['id', 'email', 'accountType']
                },
                {
                    model: GroupMember,
                    as: 'members',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'email', 'accountType']
                        }
                    ],
                    where: { status: 'accepted' },
                    required: false
                }
            ]
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is leader or member
        const isLeader = group.leaderId === req.user.id;
        const isMember = group.members.some(m => m.userId === req.user.id);

        if (!isLeader && !isMember && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a member of this group.'
            });
        }

        res.status(200).json({
            success: true,
            group,
            permissions: {
                isLeader,
                isMember,
                canManage: isLeader || req.user.role === 'admin'
            }
        });
    } catch (error) {
        console.error('Get group details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching group details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================
// MEMBER MANAGEMENT
// ============================================

// @desc    Invite a user to join group
// @route   POST /api/hierarchy/groups/:groupId/invite
// @access  Private (Leader only)
const inviteMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if group exists and user is the leader
        const group = await Group.findByPk(groupId, {
            include: [{ model: GroupMember, as: 'members', where: { status: 'accepted' }, required: false }]
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (group.leaderId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only the group leader can invite members'
            });
        }

        // Check if group is full
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({
                success: false,
                message: `Group is full. Maximum members: ${group.maxMembers}`
            });
        }

        // Find user by email
        const invitee = await User.findOne({ where: { email } });

        if (!invitee) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        // Check if already a member
        const existingMembership = await GroupMember.findOne({
            where: {
                groupId,
                userId: invitee.id,
                status: { [Op.in]: ['pending', 'accepted'] }
            }
        });

        if (existingMembership) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member or has a pending invitation'
            });
        }

        // Create invitation
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitation = await Invitation.create({
            groupId,
            inviterId: req.user.id,
            inviteeEmail: email,
            inviteeId: invitee.id,
            token,
            expiresAt
        });

        // Create pending membership
        await GroupMember.create({
            groupId,
            userId: invitee.id,
            invitedBy: req.user.id,
            status: 'pending'
        });

        // TODO: Send email notification to invitee

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            invitation: {
                id: invitation.id,
                email: invitation.inviteeEmail,
                expiresAt: invitation.expiresAt
            }
        });
    } catch (error) {
        console.error('Invite member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending invitation',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================
// INVITATION MANAGEMENT
// ============================================

// @desc    Get all invitations for current user
// @route   GET /api/hierarchy/invitations
// @access  Private
const getMyInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.findAll({
            where: {
                inviteeId: req.user.id,
                status: 'pending',
                expiresAt: { [Op.gt]: new Date() }
            },
            include: [
                {
                    model: Group,
                    as: 'group',
                    include: [
                        {
                            model: User,
                            as: 'leader',
                            attributes: ['id', 'email']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'inviter',
                    attributes: ['id', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: invitations.length,
            invitations
        });
    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invitations',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Accept invitation
// @route   POST /api/hierarchy/invitations/:invitationId/accept
// @access  Private
const acceptInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;

        const invitation = await Invitation.findByPk(invitationId);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }

        if (invitation.inviteeId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'This invitation is not for you'
            });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Invitation has already been responded to'
            });
        }

        if (new Date() > invitation.expiresAt) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(400).json({
                success: false,
                message: 'Invitation has expired'
            });
        }

        // Update invitation status
        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        await invitation.save();

        // Update membership status
        await GroupMember.update(
            {
                status: 'accepted',
                joinedAt: new Date()
            },
            {
                where: {
                    groupId: invitation.groupId,
                    userId: req.user.id
                }
            }
        );

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

// ============================================
// EXPORTS
// ============================================

module.exports = {
    createGroup,
    getMyGroups,
    getGroupDetails,
    inviteMember,
    getMyInvitations,
    acceptInvitation,

    // TODO: Implement these functions
    updateGroup: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    deleteGroup: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    removeMember: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    getGroupMembers: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    updateMemberPermissions: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    updateMemberConfig: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    rejectInvitation: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    getMyMemberships: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    leaveGroup: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    upgradeToLeader: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    getMySubscription: (req, res) => res.status(501).json({ message: 'Not implemented yet' }),
    cancelSubscription: (req, res) => res.status(501).json({ message: 'Not implemented yet' })
};