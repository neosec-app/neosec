// server/models/associations.js
// This file sets up all relationships between models

const User = require('./User');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const Invitation = require('./Invitation');
const Subscription = require('./Subscription');
const BillingHistory = require('./BillingHistory');
const VpnConfig = require('./VpnConfig');
const Profile = require('./Profile');
const SharedProfile = require('./SharedProfile');
const SharedProfileLog = require('./SharedProfileLog');


// User <-> Group (Leader relationship)
User.hasMany(Group, {
    foreignKey: 'leaderId',
    as: 'ledGroups'
});
Group.belongsTo(User, {
    foreignKey: 'leaderId',
    as: 'leader'
});

// Group <-> GroupMember
Group.hasMany(GroupMember, {
    foreignKey: 'groupId',
    as: 'members'
});
GroupMember.belongsTo(Group, {
    foreignKey: 'groupId',
    as: 'group'
});

// User <-> GroupMember (Member relationship)
User.hasMany(GroupMember, {
    foreignKey: 'userId',
    as: 'memberships'
});
GroupMember.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> Invitation
User.hasMany(Invitation, {
    foreignKey: 'inviterId',
    as: 'sentInvitations'
});
User.hasMany(Invitation, {
    foreignKey: 'inviteeId',
    as: 'receivedInvitations'
});
Invitation.belongsTo(User, {
    foreignKey: 'inviterId',
    as: 'inviter'
});
Invitation.belongsTo(User, {
    foreignKey: 'inviteeId',
    as: 'invitee'
});

// Group <-> Invitation
Group.hasMany(Invitation, {
    foreignKey: 'groupId',
    as: 'invitations'
});
Invitation.belongsTo(Group, {
    foreignKey: 'groupId',
    as: 'group'
});

// User <-> Subscription (One-to-One)
User.hasOne(Subscription, {
    foreignKey: 'userId',
    as: 'subscription',
    onDelete: 'CASCADE'
});
Subscription.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> BillingHistory (One-to-Many)
User.hasMany(BillingHistory, {
    foreignKey: 'userId',
    as: 'billingHistory',
    onDelete: 'CASCADE'
});
BillingHistory.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Subscription <-> BillingHistory (One-to-Many)
Subscription.hasMany(BillingHistory, {
    foreignKey: 'subscriptionId',
    as: 'billingHistory',
    onDelete: 'SET NULL'
});
BillingHistory.belongsTo(Subscription, {
    foreignKey: 'subscriptionId',
    as: 'subscription'
});

// User <-> VpnConfig (if not already defined)
User.hasMany(VpnConfig, {
    foreignKey: 'userId',
    as: 'vpnConfigs'
});
VpnConfig.belongsTo(User, {
    foreignKey: 'userId',
    as: 'vpnOwner'
});

// Load new models
const AuditLog = require('./AuditLog');
const Device = require('./Device');
const LoginHistory = require('./LoginHistory');
const FeatureToggle = require('./FeatureToggle');
const RoleTemplate = require('./RoleTemplate');
const MFASettings = require('./MFASettings');
const ImpersonationSession = require('./ImpersonationSession');
const BlocklistIP = require('./BlocklistIP');
const ActivityLog = require('./ActivityLog');

// User <-> AuditLog
User.hasMany(AuditLog, {
    foreignKey: 'adminUserId',
    as: 'auditLogs'
});

// User <-> Device
User.hasMany(Device, {
    foreignKey: 'userId',
    as: 'devices'
});

// User <-> LoginHistory
User.hasMany(LoginHistory, {
    foreignKey: 'userId',
    as: 'loginHistory'
});

// User <-> FeatureToggle (creator)
User.hasMany(FeatureToggle, {
    foreignKey: 'createdBy',
    as: 'createdFeatureToggles'
});

// User <-> RoleTemplate (creator)
User.hasMany(RoleTemplate, {
    foreignKey: 'createdBy',
    as: 'createdRoleTemplates'
});

// User <-> MFASettings
User.hasOne(MFASettings, {
    foreignKey: 'userId',
    as: 'mfaSettings'
});

// User <-> ImpersonationSession (Admin relationship)
User.hasMany(ImpersonationSession, {
    foreignKey: 'adminUserId',
    as: 'impersonationSessions'
});

// User <-> ImpersonationSession (Target relationship)
User.hasMany(ImpersonationSession, {
    foreignKey: 'targetUserId',
    as: 'targetImpersonationSessions'
});

// User <-> ActivityLog
User.hasMany(ActivityLog, {
    foreignKey: 'userId',
    as: 'activityLogs'
});

// Device <-> ActivityLog
Device.hasMany(ActivityLog, {
    foreignKey: 'deviceId',
    as: 'activityLogs'
});



// Profile associations
Profile.hasMany(SharedProfile, {
  foreignKey: 'profileId',
  as: 'sharedLinks'
});

// SharedProfile associations
SharedProfile.belongsTo(Profile, {
  foreignKey: 'profileId',
  as: 'profile'
});

SharedProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

SharedProfile.belongsTo(User, {
  foreignKey: 'revokedBy',
  as: 'revoker'
});

// SharedProfileLog associations
SharedProfileLog.belongsTo(SharedProfile, {
  foreignKey: 'sharedProfileId',
  as: 'sharedProfile'
});

//  Profile associations
Profile.hasMany(SharedProfile, {
  foreignKey: 'profileId',
  as: 'sharedProfiles'
});

module.exports = {
    User,
    Group,
    GroupMember,
    Invitation,
    Subscription,
    BillingHistory,
    VpnConfig,
    AuditLog,
    Device,
    LoginHistory,
    FeatureToggle,
    RoleTemplate,
    MFASettings,
    ImpersonationSession,
    BlocklistIP,
    ActivityLog,
    Profile,
    SharedProfile,
    SharedProfileLog,
};


