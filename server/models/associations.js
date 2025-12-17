// server/models/associations.js
// This file sets up all relationships between models

const User = require('./User');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const Invitation = require('./Invitation');
const Subscription = require('./Subscription');
const VpnConfig = require('./VpnConfig');

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

// User <-> Subscription
User.hasOne(Subscription, {
    foreignKey: 'userId',
    as: 'subscription'
});
Subscription.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
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

// User <-> ImpersonationSession
User.hasMany(ImpersonationSession, {
    foreignKey: 'adminUserId',
    as: 'impersonationSessions'
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

module.exports = {
    User,
    Group,
    GroupMember,
    Invitation,
    Subscription,
    VpnConfig,
    AuditLog,
    Device,
    LoginHistory,
    FeatureToggle,
    RoleTemplate,
    MFASettings,
    ImpersonationSession,
    BlocklistIP,
    ActivityLog
};


