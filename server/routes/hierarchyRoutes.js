// server/routes/hierarchyRoutes.js
const express = require('express');
const router = express.Router();
const { protect, requireLeader } = require('../middleware/auth');
const {
    // Group Management (Leader only)
    createGroup,
    getMyGroups,
    getGroupDetails,
    updateGroup,
    deleteGroup,

    // Member Management (Leader only)
    inviteMember,
    removeMember,
    getGroupMembers,
    updateMemberPermissions,
    updateMemberConfig,

    // Invitation Management
    getMyInvitations,
    acceptInvitation,
    rejectInvitation,

    // User's own group memberships
    getMyMemberships,
    leaveGroup,

    // Subscription
    upgradeToLeader,
    getMySubscription,
    cancelSubscription
} = require('../controllers/hierarchyController');

// ============================================
// GROUP MANAGEMENT ROUTES (Leader only)
// ============================================

// Create a new group (requires paid subscription)
router.post('/groups', protect, requireLeader, createGroup);

// Get all groups led by current user
router.get('/groups/my-groups', protect, requireLeader, getMyGroups);

// Get specific group details
router.get('/groups/:groupId', protect, getGroupDetails);

// Update group info
router.put('/groups/:groupId', protect, requireLeader, updateGroup);

// Delete/dissolve group
router.delete('/groups/:groupId', protect, requireLeader, deleteGroup);

// ============================================
// MEMBER MANAGEMENT ROUTES (Leader only)
// ============================================

// Invite a user to join group
router.post('/groups/:groupId/invite', protect, requireLeader, inviteMember);

// Get all members of a group
router.get('/groups/:groupId/members', protect, getGroupMembers);

// Remove a member from group
router.delete('/groups/:groupId/members/:memberId', protect, requireLeader, removeMember);

// Update member permissions
router.put('/groups/:groupId/members/:memberId/permissions', protect, requireLeader, updateMemberPermissions);

// Update member's VPN/Firewall config (leader managing member's config)
router.put('/groups/:groupId/members/:memberId/config', protect, requireLeader, updateMemberConfig);

// ============================================
// INVITATION ROUTES (All users)
// ============================================

// Get all invitations received by current user
router.get('/invitations', protect, getMyInvitations);

// Accept invitation
router.post('/invitations/:invitationId/accept', protect, acceptInvitation);

// Reject invitation
router.post('/invitations/:invitationId/reject', protect, rejectInvitation);

// ============================================
// MEMBERSHIP ROUTES (All users)
// ============================================

// Get all groups current user is a member of
router.get('/memberships', protect, getMyMemberships);

// Leave a group
router.post('/memberships/:membershipId/leave', protect, leaveGroup);

// ============================================
// SUBSCRIPTION ROUTES
// ============================================

// Upgrade to leader (payment required)
router.post('/subscription/upgrade', protect, upgradeToLeader);

// Get current subscription status
router.get('/subscription', protect, getMySubscription);

// Cancel subscription
router.post('/subscription/cancel', protect, cancelSubscription);

module.exports = router;