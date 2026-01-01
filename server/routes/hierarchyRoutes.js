// server/routes/hierarchyRoutes.js
const express = require('express');
const router = express.Router();
const { protect, requireLeader } = require('../middleware/auth');
const {
    // Group management
    createGroup,
    getMyGroups,
    getGroupMembers,

    // Invitation management
    inviteMember,
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
} = require('../controllers/hierarchyController');

// ============================================
// GROUP MANAGEMENT ROUTES
// ============================================

// Create a new group (requires paid subscription)
router.post('/groups', protect, requireLeader, createGroup);

// Get all groups led by current user
router.get('/groups/my-groups', protect, requireLeader, getMyGroups);

// Get all members of a group
router.get('/groups/:groupId/members', protect, getGroupMembers);

// Invite a user to join group
router.post('/groups/:groupId/invite', protect, requireLeader, inviteMember);

// ============================================
// INVITATION ROUTES
// ============================================

// Get all invitations received by current user
router.get('/invitations', protect, getMyInvitations);

// Accept invitation
router.post('/invitations/:invitationId/accept', protect, acceptInvitation);

// Reject invitation
router.post('/invitations/:invitationId/reject', protect, rejectInvitation);

// ============================================
// MEMBERSHIP ROUTES
// ============================================

// Get all groups current user is a member of
router.get('/memberships', protect, getMyMemberships);

// Leave a group (remove membership)
router.post('/memberships/:membershipId/leave', protect, leaveGroup);

// ============================================
// MEMBER SECURITY MANAGEMENT ROUTES (Leader only)
// ============================================

// Get member's security profiles
router.get('/members/:memberId/profiles', protect, requireLeader, getMemberProfiles);

// Update member's security profile
router.put('/members/:memberId/profiles/:profileId', protect, requireLeader, updateMemberProfile);

// Get member's firewall rules
router.get('/members/:memberId/firewall', protect, requireLeader, getMemberFirewallRules);

// Update member's firewall rule
router.put('/members/:memberId/firewall/:ruleId', protect, requireLeader, updateMemberFirewallRule);

// Get member's VPN configurations
router.get('/members/:memberId/vpn', protect, requireLeader, getMemberVPNConfigs);

// Update member's VPN configuration
router.put('/members/:memberId/vpn/:configId', protect, requireLeader, updateMemberVPNConfig);

module.exports = router;