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
    // Try to fetch profiles with logs, but handle case where ProfileLog table doesn't exist
    let profiles;
    try {
      profiles = await Profile.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        include: [{
          model: ProfileLog,
          as: 'logs',
          required: false, // Left join - don't fail if no logs
          limit: 5,
          order: [['createdAt', 'DESC']]
        }]
      });
    } catch (includeError) {
      // If ProfileLog table doesn't exist, fetch profiles without logs
      if (includeError.name === 'SequelizeDatabaseError' && 
          (includeError.message?.includes('does not exist') || includeError.message?.includes('relation'))) {
        console.warn('ProfileLog table does not exist. Fetching profiles without logs.');
        profiles = await Profile.findAll({
          where: { userId: req.user.id },
          order: [['createdAt', 'DESC']]
        });
        // Add empty logs array to each profile
        profiles = profiles.map(profile => {
          const profileData = profile.toJSON();
          profileData.logs = [];
          return profileData;
        });
      } else {
        throw includeError;
      }
    }

    res.status(200).json({
      success: true,
      count: profiles.length,
      profiles
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    console.error('Error name:', error.name);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if profiles table doesn't exist
    if (error.name === 'SequelizeDatabaseError' && 
        (error.message?.includes('does not exist') || error.message?.includes('relation'))) {
      console.warn('Profiles table does not exist yet. Returning empty array.');
      return res.status(200).json({
        success: true,
        count: 0,
        profiles: []
      });
    }
    
    // Provide more helpful error messages
    let errorMessage = 'Error fetching profiles';
    if (error.original && error.original.message) {
      errorMessage = `Database error: ${error.original.message}`;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
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
      userId: req.user.id
    };

    let profile;
    try {
      profile = await Profile.create(profileData);
    } catch (createError) {
      // If table doesn't exist, try to create it
      if (createError.name === 'SequelizeDatabaseError' && 
          (createError.message?.includes('does not exist') || createError.message?.includes('relation'))) {
        console.warn('Profiles table does not exist. Attempting to create it...');
        try {
          await Profile.sync({ force: false, alter: false });
          console.log('✅ Profiles table created successfully. Retrying profile creation...');
          profile = await Profile.create(profileData);
        } catch (syncError) {
          console.error('Failed to create profiles table:', syncError.message);
          throw createError; // Throw original error
        }
      } else {
        throw createError;
      }
    }

    // Try to create log, but don't fail if ProfileLog table doesn't exist
    try {
      await createLog(
        profile.id,
        req.user.id,
        'CREATED',
        { profileData },
        req,
        `Profile "${profile.name}" created`
      );
    } catch (logError) {
      console.warn('Could not create profile log (table may not exist):', logError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.original) {
      console.error('Original error:', error.original.message);
      console.error('Original SQL:', error.sql);
    }
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    
    // Check if profiles table doesn't exist
    if (error.name === 'SequelizeDatabaseError' && 
        (error.message?.includes('does not exist') || error.message?.includes('relation'))) {
      console.warn('Profiles table does not exist yet.');
      return res.status(500).json({
        success: false,
        message: 'Profiles table does not exist. Please ensure the database tables are created.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Check for validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationMessages = error.errors?.map(e => {
        // Provide user-friendly error messages
        if (e.path === 'name' && e.type === 'Validation len') {
          return 'Profile name must be between 3 and 50 characters';
        }
        return e.message;
      }).join(', ') || error.message;
      return res.status(400).json({
        success: false,
        message: validationMessages,
        errors: error.errors?.map(e => ({
          field: e.path,
          message: e.message
        })),
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
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
        userId: req.user.id
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

    try {
      await createLog(
        profile.id,
        req.user.id,
        'UPDATED',
        { before: oldValues, after: profile.toJSON() },
        req,
        `Profile "${profile.name}" updated`
      );
    } catch (logError) {
      console.warn('Could not create profile log (table may not exist):', logError.message);
    }

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
        userId: req.user.id
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const profileName = profile.name;

    try {
      await createLog(
        profile.id,
        req.user.id,
        'DELETED',
        { deletedProfile: profile.toJSON() },
        req,
        `Profile "${profileName}" deleted`
      );
    } catch (logError) {
      console.warn('Could not create profile log (table may not exist):', logError.message);
    }

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
      where: { userId: req.user.id }
    });

    for (const prof of allProfiles) {
      if (prof.isActive) {
        await prof.update({ isActive: false });
        try {
          await createLog(
            prof.id,
            req.user.id,
            'DEACTIVATED',
            {},
            req,
            `Profile "${prof.name}" deactivated`
          );
        } catch (logError) {
          console.warn('Could not create profile log (table may not exist):', logError.message);
        }
      }
    }

    const profile = await Profile.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
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

    // Log profile activation to activity log
    try {
      const ipAddress = getClientIP(req);
      await ActivityLog.create({
        eventType: 'Profile Activation',
        description: `Profile activated: ${profile.name}`,
        status: 'Success',
        severity: 'info',
        userId: req.user.id,
        ipAddress: ipAddress,
        metadata: {
          profileId: profile.id,
          profileName: profile.name,
          profileType: profile.profileType
        }
      });
    } catch (logError) {
      console.error('Error logging profile activation:', logError);
    }

    try {
      await createLog(
        profile.id,
        req.user.id,
        'ACTIVATED',
        { activationCount: profile.activationCount },
        req,
        `Profile "${profile.name}" activated`
      );
    } catch (logError) {
      console.warn('Could not create profile log (table may not exist):', logError.message);
    }

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
        userId: req.user.id
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
      where: { userId: req.user.id },
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
        userId: req.user.id
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

    // Log profile deactivation to activity log
    try {
      const ipAddress = getClientIP(req);
      await ActivityLog.create({
        eventType: 'Profile Deactivation',
        description: `Profile deactivated: ${profile.name}`,
        status: 'Success',
        severity: 'info',
        userId: req.user.id,
        ipAddress: ipAddress,
        metadata: {
          profileId: profile.id,
          profileName: profile.name,
          profileType: profile.profileType
        }
      });
    } catch (logError) {
      console.error('Error logging profile deactivation:', logError);
    }

    try {
      await createLog(
        profile.id,
        req.user.id,
        'DEACTIVATED',
        {},
        req,
        `Profile "${profile.name}" deactivated`
      );
    } catch (logError) {
      console.warn('Could not create profile log (table may not exist):', logError.message);
    }

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