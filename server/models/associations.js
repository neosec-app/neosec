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
    as: 'user'
});

module.exports = {
    User,
    Group,
    GroupMember,
    Invitation,
    Subscription,
    VpnConfig
};