const User = require('./User');
const Profile = require('./Profile');
const ProfileLog = require('./ProfileLog');
const ScanHistory = require('./scanhistory');

User.hasMany(Profile, {
  foreignKey: 'userId',
  as: 'profiles',
  onDelete: 'CASCADE'
});

Profile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(ProfileLog, {
  foreignKey: 'userId',
  as: 'profileLogs',
  onDelete: 'CASCADE'
});

ProfileLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Profile.hasMany(ProfileLog, {
  foreignKey: 'profileId',
  as: 'logs',
  onDelete: 'CASCADE'
});

ProfileLog.belongsTo(Profile, {
  foreignKey: 'profileId',
  as: 'profile'
});

module.exports = {
  User,
  Profile,
  ProfileLog,
  ScanHistory
};
