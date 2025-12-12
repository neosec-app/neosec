// server/models/index.js

const User = require('./User');
const Profile = require('./Profile');
const ProfileLog = require('./ProfileLog');
const ScanHistory = require('./scanhistory');

const Subscription = require('./Subscription');
const Notification = require('./Notification');

const Group = require('./Group');
const GroupMember = require('./GroupMember');
const Invitation = require('./Invitation');

const VpnConfig = require('./VpnConfig'); // only if you actually have this file

// load associations AFTER models exist
require('./associations');

// your profile associations (these were in your old index.js)
User.hasMany(Profile, { foreignKey: 'userId', as: 'profiles', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ProfileLog, { foreignKey: 'userId', as: 'profileLogs', onDelete: 'CASCADE' });
ProfileLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Profile.hasMany(ProfileLog, { foreignKey: 'profileId', as: 'logs', onDelete: 'CASCADE' });
ProfileLog.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

module.exports = {
    User,
    Profile,
    ProfileLog,
    ScanHistory,

    Subscription,
    Notification,

    Group,
    GroupMember,
    Invitation,

    VpnConfig,
};
