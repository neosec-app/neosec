const Profile = require('../models/Profile');
const SharedProfile = require('../models/SharedProfile');
const SharedProfileLog = require('../models/SharedProfileLog');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const sanitizeProfileData = (profile) => {
  const profileData = profile.toJSON ? profile.toJSON() : profile;
  const sanitized = { ...profileData };

  // VPN must NEVER be shared
  sanitized.vpnEnabled = false;
  sanitized.vpnServer = null;
  sanitized.vpnProtocol = null;
  sanitized.vpnPort = null;
  sanitized.vpnUsername = null;

  // Optional: keep a hint for UI
  sanitized._vpnNotShared = true;
  sanitized._credentialsRedacted = true;

  return sanitized;
};

// Helper function to log activity
const logActivity = async (sharedProfileId, action, req, metadata = {}) => {
  try {
    await SharedProfileLog.create({
      sharedProfileId,
      action,
      accessorEmail: req.user?.email || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata,
      description: metadata.description || null
    });
  } catch (error) {
    console.error('Error logging shared profile activity:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
};

exports.createShareLink = async (req, res) => {
  try {
    const {
      profileId,
      password,
      permissions = 'VIEW',
      expiresInDays,
      maxAccess
    } = req.body;

    const profile = await Profile.findOne({
      where: { id: profileId, userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Hash password if provided
    let encryptedPassword = null;
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      encryptedPassword = await bcrypt.hash(password, salt);
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Sanitized snapshot of profile
    const profileSnapshot = sanitizeProfileData(profile);

    const sharedProfile = await SharedProfile.create({
      profileId,
      userId: req.user.id,
      shareToken,
      encryptedPassword,
      permissions,
      expiresAt,
      maxAccess: maxAccess || null,
      profileSnapshot 
    });

    // Log activity asynchronously (fire-and-forget)
    logActivity(sharedProfile.id, 'CREATED', req, {
      description: `Share link created for profile "${profile.name}"`,
      permissions,
      hasPassword: !!encryptedPassword,
      expiresAt,
      maxAccess: maxAccess || null
    }).catch(err => console.error('Failed to log activity:', err));

    res.status(201).json({
      success: true,
      data: {
        id: sharedProfile.id,
        shareToken: sharedProfile.shareToken,
        shareUrl: `${req.protocol}://${req.get('host')}/shared-profiles/${sharedProfile.shareToken}`,
        permissions: sharedProfile.permissions,
        expiresAt: sharedProfile.expiresAt,
        hasPassword: !!encryptedPassword,
        maxAccess: sharedProfile.maxAccess,
        createdAt: sharedProfile.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating share link',
      error: error.message
    });
  }
};

exports.getSharedProfile = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const sharedProfile = await SharedProfile.findOne({
      where: { shareToken: token },
      include: [
        { 
          model: Profile, 
          as: 'profile',
          required: false 
        },
        { 
          model: User, 
          as: 'owner', 
          attributes: ['email'] 
        }
      ]
    });

    if (!sharedProfile) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    // CRITICAL: Check profileSnapshot exists early
    if (!sharedProfile.profileSnapshot || !sharedProfile.profileSnapshot.name) {
      console.error('Corrupted profileSnapshot for shared profile:', {
        id: sharedProfile.id,
        shareToken: sharedProfile.shareToken,
        hasProfileSnapshot: !!sharedProfile.profileSnapshot,
        profileSnapshotKeys: sharedProfile.profileSnapshot ? Object.keys(sharedProfile.profileSnapshot) : 'null',
        createdAt: sharedProfile.createdAt
      });
      return res.status(500).json({
        success: false,
        message: 'Shared profile data is corrupted or unavailable. Please create a new share link.'
      });
    }

    // Check if active
    if (!sharedProfile.isActive || sharedProfile.revokedAt) {
      // Log asynchronously
      logActivity(sharedProfile.id, 'ACCESS_DENIED', req, {
        description: 'Attempted to access revoked link',
        reason: 'REVOKED'
      }).catch(err => console.error('Failed to log activity:', err));

      return res.status(403).json({
        success: false,
        message: 'This share link has been revoked'
      });
    }

    // Check expired
    if (sharedProfile.expiresAt && new Date() > new Date(sharedProfile.expiresAt)) {
      // Log asynchronously
      logActivity(sharedProfile.id, 'EXPIRED', req, {
        description: 'Attempted to access expired link'
      }).catch(err => console.error('Failed to log activity:', err));

      return res.status(403).json({
        success: false,
        message: 'This share link has expired'
      });
    }

    // Check max access
    const accessCount = sharedProfile.accessCount || 0;
    const maxAccess = sharedProfile.maxAccess;

    if (maxAccess !== null && accessCount >= maxAccess) {
      // Log asynchronously
      logActivity(sharedProfile.id, 'ACCESS_DENIED', req, {
        description: 'Max access limit reached',
        reason: 'MAX_ACCESS_EXCEEDED'
      }).catch(err => console.error('Failed to log activity:', err));

      return res.status(403).json({
        success: false,
        message: 'This share link has reached its maximum access limit'
      });
    }

    // Password check
    if (sharedProfile.encryptedPassword) {
      if (!password) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          message: 'Password required to access this profile'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, sharedProfile.encryptedPassword);
      if (!isPasswordValid) {
        // Log asynchronously
        logActivity(sharedProfile.id, 'PASSWORD_FAILED', req, {
          description: 'Invalid password attempt'
        }).catch(err => console.error('Failed to log activity:', err));

        return res.status(401).json({ success: false, message: 'Invalid password' });
      }
    }

    // Update access count
    await sharedProfile.update({
      accessCount: accessCount + 1,
      lastAccessedAt: new Date()
    });

    // Use profileSnapshot
    const profileData = sharedProfile.profileSnapshot;

    // Log viewing activity asynchronously (fire-and-forget)
    logActivity(sharedProfile.id, 'VIEWED', req, {
      description: `Profile "${profileData.name}" viewed via share link`
    }).catch(err => console.error('Failed to log activity:', err));

    // Send response
    res.json({
      success: true,
      data: {
        profile: profileData,
        shareInfo: {
          permissions: sharedProfile.permissions,
          sharedBy: sharedProfile.owner?.email || 'Unknown',
          createdAt: sharedProfile.createdAt,
          expiresAt: sharedProfile.expiresAt,
          accessCount: sharedProfile.accessCount,
          maxAccess: sharedProfile.maxAccess
        }
      }
    });

  } catch (error) {
    console.error('Error fetching shared profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shared profile',
      error: error.message
    });
  }
};

exports.importSharedProfile = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, customName } = req.body;

    const sharedProfile = await SharedProfile.findOne({
      where: { shareToken: token }
    });

    if (!sharedProfile) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    // Check profileSnapshot early
    if (!sharedProfile.profileSnapshot || !sharedProfile.profileSnapshot.name) {
      return res.status(500).json({
        success: false,
        message: 'Shared profile data is corrupted'
      });
    }

    if (sharedProfile.permissions !== 'IMPORT') {
      return res.status(403).json({
        success: false,
        message: 'This link only allows viewing, not importing'
      });
    }

    if (!sharedProfile.isActive || sharedProfile.revokedAt) {
      return res.status(403).json({ success: false, message: 'This share link has been revoked' });
    }

    if (sharedProfile.expiresAt && new Date() > new Date(sharedProfile.expiresAt)) {
      return res.status(403).json({ success: false, message: 'This share link has expired' });
    }

    const accessCount = sharedProfile.accessCount || 0;
    const maxAccess = sharedProfile.maxAccess;

    if (maxAccess !== null && accessCount >= maxAccess) {
      return res.status(403).json({ success: false, message: 'This share link has reached its maximum access limit' });
    }

    if (sharedProfile.encryptedPassword) {
      if (!password) return res.status(401).json({ success: false, message: 'Password required' });

      const ok = await bcrypt.compare(password, sharedProfile.encryptedPassword);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid password' });    
    }

    // Use profileSnapshot
    const originalProfile = sharedProfile.profileSnapshot;

    // Create new profile for importer
    const newProfile = await Profile.create({
      userId: req.user.id,
      name: customName || `${originalProfile.name} (Imported)`,
      description: (originalProfile.description || '') + '\n\n[Imported from shared profile]',
      profileType: originalProfile.profileType,

      // VPN NEVER imported
      vpnEnabled: false,
      vpnServer: null,
      vpnProtocol: null,
      vpnPort: null,
      vpnUsername: null,

      firewallEnabled: originalProfile.firewallEnabled,
      firewallRules: originalProfile.firewallRules,
      defaultFirewallAction: originalProfile.defaultFirewallAction,

      dnsEnabled: originalProfile.dnsEnabled,
      primaryDns: originalProfile.primaryDns,
      secondaryDns: originalProfile.secondaryDns,
      dnsSecurity: originalProfile.dnsSecurity,

      allowedIps: originalProfile.allowedIps,
      blockedIps: originalProfile.blockedIps,
      allowedPorts: originalProfile.allowedPorts,
      blockedPorts: originalProfile.blockedPorts,

      isScheduled: false,
      scheduleType: 'NONE',
      scheduleStartTime: null,
      scheduleEndTime: null,
      scheduleDays: [],
      scheduleCondition: null,
      autoActivate: false,

      isActive: false
    });

    // Log asynchronously
    logActivity(sharedProfile.id, 'IMPORTED', req, {
      description: `Profile imported by ${req.user.email}`,
      newProfileId: newProfile.id
    }).catch(err => console.error('Failed to log activity:', err));

    res.status(201).json({
      success: true,
      message: 'Profile imported successfully',
      data: newProfile
    });
  } catch (error) {
    console.error('Error importing profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing profile',
      error: error.message
    });
  }
};

exports.getMyShareLinks = async (req, res) => {
  try {
    const { profileId } = req.query;

    const where = {
      userId: req.user.id
    };

    if (profileId) {
      where.profileId = profileId;
    }

    const links = await SharedProfile.findAll({
      where,
      include: [{
        model: Profile,
        as: 'profile',
        attributes: ['id', 'name', 'description'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: links });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch share links' });
  }
};

exports.revokeShareLink = async (req, res) => {
  try {
    const { id } = req.params;

    const sharedProfile = await SharedProfile.findOne({
      where: { id, userId: req.user.id }
    });

    if (!sharedProfile) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    await sharedProfile.update({
      isActive: false,
      revokedAt: new Date()
    });

    // Log asynchronously
    logActivity(sharedProfile.id, 'REVOKED', req, {
      description: `Share link revoked by ${req.user.email}`
    }).catch(err => console.error('Failed to log activity:', err));

    res.json({ success: true, message: 'Share link revoked successfully' });
  } catch (error) {
    console.error('Error revoking share link:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking share link',
      error: error.message
    });
  }
};
exports.debugSharedProfile = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('🔍 Debug request for token:', token);

    const sharedProfile = await SharedProfile.findOne({
      where: { shareToken: token },
      include: [
        { 
          model: Profile, 
          as: 'profile',
          required: false 
        },
        { 
          model: User, 
          as: 'owner', 
          attributes: ['email'] 
        }
      ]
    });

    if (!sharedProfile) {
      return res.json({
        found: false,
        message: 'Share link not found'
      });
    }

    const debug = {
      found: true,
      id: sharedProfile.id,
      shareToken: sharedProfile.shareToken,
      hasProfileSnapshot: !!sharedProfile.profileSnapshot,
      profileSnapshotType: typeof sharedProfile.profileSnapshot,
      profileSnapshotKeys: sharedProfile.profileSnapshot ? Object.keys(sharedProfile.profileSnapshot) : null,
      hasName: sharedProfile.profileSnapshot?.name,
      profileSnapshotData: sharedProfile.profileSnapshot,
      isActive: sharedProfile.isActive,
      revokedAt: sharedProfile.revokedAt,
      permissions: sharedProfile.permissions,
      ownerEmail: sharedProfile.owner?.email
    };

    console.log('Debug info:', JSON.stringify(debug, null, 2));

    res.json(debug);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};

exports.getShareLinkLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const sharedProfile = await SharedProfile.findOne({
      where: { id, userId: req.user.id }
    });

    if (!sharedProfile) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    // Check profileSnapshot
    if (!sharedProfile.profileSnapshot || !sharedProfile.profileSnapshot.name) {
      return res.status(500).json({
        success: false,
        message: 'Shared profile data is corrupted'
      });
    }

    const logs = await SharedProfileLog.findAll({
      where: { sharedProfileId: id },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs',
      error: error.message
    });
  }
};

exports.deleteShareLink = async (req, res) => {
  try {
    const { id } = req.params;

    const sharedProfile = await SharedProfile.findOne({
      where: { id, userId: req.user.id }
    });

    if (!sharedProfile) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    await sharedProfile.destroy();

    res.json({ success: true, message: 'Share link deleted successfully' });
  } catch (error) {
    console.error('Error deleting share link:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting share link',
      error: error.message
    });
  }
};