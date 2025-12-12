const { Profile, ProfileLog, User } = require('../models');

const createLog = async (profileId, userId, action, changes, req, description) => {
  try {
    const user = await User.findByPk(userId);
    await ProfileLog.create({
      profileId,
      userId,
      action,
      changes,
      userEmail: user.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      description
    });
  } catch (error) {
    console.error('Error creating log:', error);
  }
};

const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: ProfileLog,
        as: 'logs',
        limit: 5,
        order: [['createdAt', 'DESC']]
      }]
    });

    res.status(200).json({
      success: true,
      count: profiles.length,
      profiles
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profiles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: [{
        model: ProfileLog,
        as: 'logs',
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createProfile = async (req, res) => {
  try {
    const profileData = {
      ...req.body,
      userId: req.user.userId
    };

    const profile = await Profile.create(profileData);

    await createLog(
      profile.id,
      req.user.userId,
      'CREATED',
      { profileData },
      req,
      `Profile "${profile.name}" created`
    );

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const oldValues = profile.toJSON();
    
    await profile.update(req.body);

    await createLog(
      profile.id,
      req.user.userId,
      'UPDATED',
      { before: oldValues, after: profile.toJSON() },
      req,
      `Profile "${profile.name}" updated`
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const profileName = profile.name;

    await createLog(
      profile.id,
      req.user.userId,
      'DELETED',
      { deletedProfile: profile.toJSON() },
      req,
      `Profile "${profileName}" deleted`
    );

    await profile.destroy();

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const activateProfile = async (req, res) => {
  try {
    const allProfiles = await Profile.findAll({
      where: { userId: req.user.userId }
    });

    for (const prof of allProfiles) {
      if (prof.isActive) {
        await prof.update({ isActive: false });
        await createLog(
          prof.id,
          req.user.userId,
          'DEACTIVATED',
          {},
          req,
          `Profile "${prof.name}" deactivated`
        );
      }
    }

    const profile = await Profile.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    await profile.update({
      isActive: true,
      lastActivatedAt: new Date(),
      activationCount: profile.activationCount + 1
    });

    await createLog(
      profile.id,
      req.user.userId,
      'ACTIVATED',
      { activationCount: profile.activationCount },
      req,
      `Profile "${profile.name}" activated`
    );

    res.status(200).json({
      success: true,
      message: 'Profile activated successfully',
      profile
    });
  } catch (error) {
    console.error('Activate profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProfileLogs = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const logs = await ProfileLog.findAll({
      where: { profileId: req.params.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(req.query.limit) || 50
    });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Get profile logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAllLogs = async (req, res) => {
  try {
    const logs = await ProfileLog.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(req.query.limit) || 100,
      include: [{
        model: Profile,
        as: 'profile',
        attributes: ['id', 'name', 'profileType']
      }]
    });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Get all logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const deactivateProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    if (!profile.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Profile is already inactive'
      });
    }

    await profile.update({
      isActive: false
    });
    await createLog(
      profile.id,
      req.user.userId,
      'DEACTIVATED',
      {},
      req,
      `Profile "${profile.name}" deactivated`
    );

    res.status(200).json({
      success: true,
      message: 'Profile deactivated successfully',
      profile
    });
  } catch (error) {
    console.error('Deactivate profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  deactivateProfile,
  activateProfile,
  getProfileLogs,
  getAllLogs
};