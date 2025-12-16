const FeatureToggle = require('../models/FeatureToggle');
const User = require('../models/User');
const Group = require('../models/Group');
const { Op } = require('sequelize');

// Get all feature toggles
const getFeatureToggles = async (req, res) => {
  try {
    const toggles = await FeatureToggle.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email']
        },
        {
          model: User,
          as: 'targetUser',
          attributes: ['id', 'email'],
          required: false
        },
        {
          model: Group,
          as: 'targetGroup',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: toggles
    });
  } catch (error) {
    console.error('Get feature toggles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching feature toggles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check if a feature is enabled for a user
const checkFeatureAccess = async (req, res) => {
  try {
    const { featureName } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const accountType = req.user.accountType;

    // Get all toggles for this feature
    const toggles = await FeatureToggle.findAll({
      where: {
        featureName,
        enabled: true
      },
      include: [
        {
          model: User,
          as: 'targetUser',
          required: false
        },
        {
          model: Group,
          as: 'targetGroup',
          required: false,
          include: [
            {
              model: require('../models/GroupMember'),
              as: 'members',
              where: { userId },
              required: false
            }
          ]
        }
      ]
    });

    // Check if user has access
    let hasAccess = true; // Default: enabled

    for (const toggle of toggles) {
      if (toggle.targetType === 'all') {
        hasAccess = toggle.enabled;
      } else if (toggle.targetType === 'user' && toggle.targetId === userId) {
        hasAccess = toggle.enabled;
      } else if (toggle.targetType === 'role' && toggle.targetRole === userRole) {
        hasAccess = toggle.enabled;
      } else if (toggle.targetType === 'group' && toggle.targetGroup) {
        hasAccess = toggle.enabled;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        featureName,
        enabled: hasAccess
      }
    });
  } catch (error) {
    console.error('Check feature access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking feature access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create or update feature toggle
const setFeatureToggle = async (req, res) => {
  try {
    const {
      featureName,
      enabled,
      targetType,
      targetId,
      targetRole,
      description
    } = req.body;

    if (!featureName) {
      return res.status(400).json({
        success: false,
        message: 'featureName is required'
      });
    }

    const [toggle, created] = await FeatureToggle.findOrCreate({
      where: {
        featureName,
        targetType: targetType || 'all',
        targetId: targetId || null,
        targetRole: targetRole || null
      },
      defaults: {
        featureName,
        enabled: enabled !== undefined ? enabled : true,
        targetType: targetType || 'all',
        targetId: targetId || null,
        targetRole: targetRole || null,
        description: description || null,
        createdBy: req.user.id
      }
    });

    if (!created) {
      toggle.enabled = enabled !== undefined ? enabled : toggle.enabled;
      toggle.description = description !== undefined ? description : toggle.description;
      await toggle.save();
    }

    res.status(created ? 201 : 200).json({
      success: true,
      data: toggle,
      created
    });
  } catch (error) {
    console.error('Set feature toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting feature toggle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete feature toggle
const deleteFeatureToggle = async (req, res) => {
  try {
    const { id } = req.params;

    const toggle = await FeatureToggle.findByPk(id);
    if (!toggle) {
      return res.status(404).json({
        success: false,
        message: 'Feature toggle not found'
      });
    }

    await toggle.destroy();

    res.status(200).json({
      success: true,
      message: 'Feature toggle deleted successfully'
    });
  } catch (error) {
    console.error('Delete feature toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting feature toggle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getFeatureToggles,
  checkFeatureAccess,
  setFeatureToggle,
  deleteFeatureToggle
};

