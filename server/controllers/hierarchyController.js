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
    // @desc    Update group
    // @route   PUT /api/hierarchy/groups/:groupId
    // @access  Private (Leader only)
    updateGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const { name, description, maxMembers } = req.body;

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
                    message: 'Only the group leader can update this group'
                });
            }

            if (name) group.name = name;
            if (description !== undefined) group.description = description;
            if (maxMembers) group.maxMembers = maxMembers;

            await group.save();

            res.status(200).json({
                success: true,
                message: 'Group updated successfully',
                group
            });
        } catch (error) {
            console.error('Update group error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating group',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Delete group
    // @route   DELETE /api/hierarchy/groups/:groupId
    // @access  Private (Leader only)
    deleteGroup: async (req, res) => {
        try {
            const { groupId } = req.params;

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
                    message: 'Only the group leader can delete this group'
                });
            }

            // Soft delete - mark as inactive
            group.isActive = false;
            await group.save();

            res.status(200).json({
                success: true,
                message: 'Group deleted successfully'
            });
        } catch (error) {
            console.error('Delete group error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting group',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Get group members
    // @route   GET /api/hierarchy/groups/:groupId/members
    // @access  Private
    getGroupMembers: async (req, res) => {
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
                message: 'Error fetching members',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Remove member from group
    // @route   DELETE /api/hierarchy/groups/:groupId/members/:memberId
    // @access  Private (Leader only)
    removeMember: async (req, res) => {
        try {
            const { groupId, memberId } = req.params;

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
                    message: 'Only the group leader can remove members'
                });
            }

            const member = await GroupMember.findByPk(memberId);

            if (!member || member.groupId !== groupId) {
                return res.status(404).json({
                    success: false,
                    message: 'Member not found in this group'
                });
            }

            member.status = 'removed';
            await member.save();

            res.status(200).json({
                success: true,
                message: 'Member removed successfully'
            });
        } catch (error) {
            console.error('Remove member error:', error);
            res.status(500).json({
                success: false,
                message: 'Error removing member',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Update member permissions
    // @route   PUT /api/hierarchy/groups/:groupId/members/:memberId/permissions
    // @access  Private (Leader only)
    updateMemberPermissions: async (req, res) => {
        try {
            const { groupId, memberId } = req.params;
            const { canLeaderManageConfigs } = req.body;

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
                    message: 'Only the group leader can update permissions'
                });
            }

            const member = await GroupMember.findByPk(memberId);

            if (!member || member.groupId !== groupId) {
                return res.status(404).json({
                    success: false,
                    message: 'Member not found in this group'
                });
            }

            member.canLeaderManageConfigs = canLeaderManageConfigs;
            await member.save();

            res.status(200).json({
                success: true,
                message: 'Permissions updated successfully',
                member
            });
        } catch (error) {
            console.error('Update permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating permissions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Update member config
    // @route   PUT /api/hierarchy/groups/:groupId/members/:memberId/config
    // @access  Private (Leader only)
    updateMemberConfig: async (req, res) => {
        try {
            res.status(501).json({
                success: false,
                message: 'Config management not implemented yet. Coming soon!'
            });
        } catch (error) {
            console.error('Update member config error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating member config',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    // @desc    Reject invitation
    // @route   POST /api/hierarchy/invitations/:invitationId/reject
    // @access  Private
    rejectInvitation: async (req, res) => {
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

            // Update invitation status
            invitation.status = 'rejected';
            await invitation.save();

            // Update membership status
            await GroupMember.update(
                { status: 'rejected' },
                {
                    where: {
                        groupId: invitation.groupId,
                        userId: req.user.id
                    }
                }
            );

            res.status(200).json({
                success: true,
                message: 'Invitation rejected'
            });
        } catch (error) {
            console.error('Reject invitation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error rejecting invitation',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Get my memberships
    // @route   GET /api/hierarchy/memberships
    // @access  Private
    getMyMemberships: async (req, res) => {
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
                                model: User,
                                as: 'leader',
                                attributes: ['id', 'email', 'accountType']
                            },
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

            res.status(200).json({
                success: true,
                count: memberships.length,
                memberships
            });
        } catch (error) {
            console.error('Get memberships error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching memberships',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Leave a group
    // @route   POST /api/hierarchy/memberships/:membershipId/leave
    // @access  Private
    leaveGroup: async (req, res) => {
        try {
            const { membershipId } = req.params;

            const membership = await GroupMember.findByPk(membershipId);

            if (!membership) {
                return res.status(404).json({
                    success: false,
                    message: 'Membership not found'
                });
            }

            if (membership.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'This is not your membership'
                });
            }

            // Update status to removed
            membership.status = 'removed';
            await membership.save();

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
    },
    // @desc    Upgrade user to leader
    // @route   POST /api/hierarchy/subscription/upgrade
    // @access  Private
    upgradeToLeader: async (req, res) => {
        try {
            const { tier } = req.body;

            if (!['basic', 'pro', 'enterprise'].includes(tier)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid subscription tier'
                });
            }

            // Update user
            await User.update(
                {
                    accountType: 'leader',
                    subscriptionTier: tier,
                    isPaid: true
                },
                { where: { id: req.user.id } }
            );

            // Create subscription record
            await Subscription.create({
                userId: req.user.id,
                tier,
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                autoRenew: true
            });

            res.status(200).json({
                success: true,
                message: 'Successfully upgraded to leader!',
                user: {
                    ...req.user.toJSON(),
                    accountType: 'leader',
                    subscriptionTier: tier,
                    isPaid: true
                }
            });
        } catch (error) {
            console.error('Upgrade error:', error);
            res.status(500).json({
                success: false,
                message: 'Error upgrading account',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Get current subscription
    // @route   GET /api/hierarchy/subscription
    // @access  Private
    getMySubscription: async (req, res) => {
        try {
            const subscription = await Subscription.findOne({
                where: { userId: req.user.id },
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json({
                success: true,
                subscription: subscription || null,
                user: {
                    accountType: req.user.accountType,
                    subscriptionTier: req.user.subscriptionTier,
                    isPaid: req.user.isPaid
                }
            });
        } catch (error) {
            console.error('Get subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching subscription',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // @desc    Cancel subscription
    // @route   POST /api/hierarchy/subscription/cancel
    // @access  Private
    cancelSubscription: async (req, res) => {
        try {
            await Subscription.update(
                { status: 'canceled', autoRenew: false },
                { where: { userId: req.user.id } }
            );

            res.status(200).json({
                success: true,
                message: 'Subscription canceled successfully'
            });
        } catch (error) {
            console.error('Cancel subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Error canceling subscription',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};