const MFASettings = require('../models/MFASettings');
const User = require('../models/User');
const crypto = require('crypto');

// Get MFA settings for user
const getMFASettings = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.params.userId ? req.params.userId : req.user.id;

    let mfaSettings = await MFASettings.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email']
        }
      ]
    });

    if (!mfaSettings) {
      // Create default settings
      mfaSettings = await MFASettings.create({
        userId,
        enabled: false
      });
    }

    // Don't send secret to client unless setting up
    const response = mfaSettings.toJSON();
    if (response.secret) {
      delete response.secret;
    }

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Get MFA settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching MFA settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Setup MFA (generate secret)
const setupMFA = async (req, res) => {
  try {
    const { method = 'authenticator_app' } = req.body;
    const userId = req.user.id;

    if (!['authenticator_app', 'email_otp'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MFA method. Use authenticator_app or email_otp'
      });
    }

    let mfaSettings = await MFASettings.findOne({ where: { userId } });

    if (method === 'authenticator_app') {
      // Generate secret for authenticator app (32 character base32 string)
      const secret = crypto.randomBytes(20).toString('base64').replace(/[^A-Z2-7]/g, '').substring(0, 32);

      if (!mfaSettings) {
        mfaSettings = await MFASettings.create({
          userId,
          method: 'authenticator_app',
          secret: secret,
          enabled: false
        });
      } else {
        mfaSettings.method = 'authenticator_app';
        mfaSettings.secret = secret;
        mfaSettings.enabled = false;
        await mfaSettings.save();
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );
      mfaSettings.backupCodes = backupCodes;
      await mfaSettings.save();

      res.status(200).json({
        success: true,
        data: {
          secret: secret,
          backupCodes: backupCodes,
          manualEntryKey: secret,
          message: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'
        }
      });
    } else {
      // Email OTP - no secret needed
      if (!mfaSettings) {
        mfaSettings = await MFASettings.create({
          userId,
          method: 'email_otp',
          enabled: false
        });
      } else {
        mfaSettings.method = 'email_otp';
        mfaSettings.secret = null;
        mfaSettings.enabled = false;
        await mfaSettings.save();
      }

      res.status(200).json({
        success: true,
        data: {
          method: 'email_otp',
          message: 'MFA setup complete. OTP will be sent to your email on login.'
        }
      });
    }
  } catch (error) {
    console.error('Setup MFA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting up MFA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify and enable MFA
const verifyMFA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const mfaSettings = await MFASettings.findOne({ where: { userId } });
    if (!mfaSettings || !mfaSettings.secret) {
      return res.status(400).json({
        success: false,
        message: 'MFA not set up. Please set up MFA first.'
      });
    }

    if (mfaSettings.method === 'authenticator_app') {
      // In production, use speakeasy or similar library for TOTP verification
      // For now, accept any 6-digit code (this should be replaced with proper TOTP verification)
      if (!/^\d{6}$/.test(token) && !mfaSettings.backupCodes?.includes(token)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please enter the 6-digit code from your authenticator app.'
        });
      }
      
      // If it's a backup code, remove it
      if (mfaSettings.backupCodes?.includes(token)) {
        mfaSettings.backupCodes = mfaSettings.backupCodes.filter(code => code !== token);
        await mfaSettings.save();
      }
    } else if (mfaSettings.method === 'email_otp') {
      // In production, verify OTP sent via email
      // For now, accept any 6-digit code
      if (!/^\d{6}$/.test(token)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP format'
        });
      }
    }

    mfaSettings.enabled = true;
    await mfaSettings.save();

    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully',
      data: mfaSettings
    });
  } catch (error) {
    console.error('Verify MFA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying MFA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Disable MFA
const disableMFA = async (req, res) => {
  try {
    const userId = req.user.id;

    const mfaSettings = await MFASettings.findOne({ where: { userId } });
    if (!mfaSettings) {
      return res.status(404).json({
        success: false,
        message: 'MFA not set up'
      });
    }

    mfaSettings.enabled = false;
    mfaSettings.secret = null;
    mfaSettings.method = null;
    await mfaSettings.save();

    res.status(200).json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error disabling MFA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getMFASettings,
  setupMFA,
  verifyMFA,
  disableMFA
};

