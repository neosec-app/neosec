const ImpersonationSession = require('../models/ImpersonationSession');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../middleware/auditLogger');

// Start impersonation session
const startImpersonation = async (req, res) => {
  try {
    const { targetUserId, reason } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required'
      });
    }

    // Don't allow impersonating yourself
    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot impersonate yourself'
      });
    }

    const targetUser = await User.findByPk(targetUserId, {
      attributes: { exclude: ['password'] }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // End any existing active session for this admin
    await ImpersonationSession.update(
      { isActive: false, endedAt: new Date() },
      {
        where: {
          adminUserId: req.user.id,
          isActive: true
        }
      }
    );

    // Create new session
    const session = await ImpersonationSession.create({
      adminUserId: req.user.id,
      targetUserId,
      reason: reason || null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      isActive: true
    });

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET is not set',
        error: process.env.NODE_ENV === 'development' ? 'JWT_SECRET environment variable is required' : undefined
      });
    }

    // Generate token for impersonated user
    const token = jwt.sign(
      { userId: targetUser.id, role: targetUser.role, impersonated: true, adminId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log the action
    await createAuditLog(
      req.user.id,
      'User Impersonation Started',
      'Security',
      {
        targetUserId,
        details: `Started impersonation session for ${targetUser.email}. Reason: ${reason || 'Not specified'}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
      }
    );

    res.status(200).json({
      success: true,
      message: 'Impersonation session started',
      data: {
        session,
        targetUser,
        token
      }
    });
  } catch (error) {
    console.error('Start impersonation error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific database errors
    if (error.name === 'SequelizeDatabaseError') {
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        console.error('Database table "impersonation_sessions" does not exist. Attempting to create it...');
        
        // Helper function to retry the impersonation operation
        const retryImpersonation = async () => {
          const { targetUserId, reason } = req.body;

          if (!targetUserId) {
            return res.status(400).json({
              success: false,
              message: 'targetUserId is required'
            });
          }

          if (targetUserId === req.user.id) {
            return res.status(400).json({
              success: false,
              message: 'You cannot impersonate yourself'
            });
          }

          const targetUser = await User.findByPk(targetUserId, {
            attributes: { exclude: ['password'] }
          });

          if (!targetUser) {
            return res.status(404).json({
              success: false,
              message: 'Target user not found'
            });
          }

          // End any existing active session for this admin
          await ImpersonationSession.update(
            { isActive: false, endedAt: new Date() },
            {
              where: {
                adminUserId: req.user.id,
                isActive: true
              }
            }
          );

          // Create new session
          const session = await ImpersonationSession.create({
            adminUserId: req.user.id,
            targetUserId,
            reason: reason || null,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
            isActive: true
          });

          if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set in environment variables');
            return res.status(500).json({
              success: false,
              message: 'Server configuration error: JWT_SECRET is not set',
              error: process.env.NODE_ENV === 'development' ? 'JWT_SECRET environment variable is required' : undefined
            });
          }

          const token = jwt.sign(
            { userId: targetUser.id, role: targetUser.role, impersonated: true, adminId: req.user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
          );

          await createAuditLog(
            req.user.id,
            'User Impersonation Started',
            'Security',
            {
              targetUserId,
              details: `Started impersonation session for ${targetUser.email}. Reason: ${reason || 'Not specified'}`,
              ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
            }
          );

          return res.status(200).json({
            success: true,
            message: 'Impersonation session started',
            data: {
              session,
              targetUser,
              token
            }
          });
        };
        
        // Try to create the table automatically
        try {
          console.log('Attempting to sync ImpersonationSession model...');
          await ImpersonationSession.sync({ force: false, alter: false });
          console.log('✅ Table impersonation_sessions created successfully. Retrying operation...');
          return await retryImpersonation();
        } catch (syncError) {
          console.error('Failed to create table with sync:', syncError.message);
          console.error('Sync error details:', {
            name: syncError.name,
            message: syncError.message,
            original: syncError.original?.message,
            sql: syncError.sql
          });
          
          // Try creating table with raw SQL as fallback
          try {
            console.log('Attempting to create table with raw SQL...');
            const { sequelize } = require('../config/db');
            await sequelize.query(`
              CREATE TABLE IF NOT EXISTS impersonation_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                started_at TIMESTAMP NOT NULL DEFAULT NOW(),
                ended_at TIMESTAMP,
                reason TEXT,
                ip_address VARCHAR(255),
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
              );
              
              CREATE INDEX IF NOT EXISTS idx_impersonation_admin_user_id ON impersonation_sessions(admin_user_id);
              CREATE INDEX IF NOT EXISTS idx_impersonation_target_user_id ON impersonation_sessions(target_user_id);
              CREATE INDEX IF NOT EXISTS idx_impersonation_is_active ON impersonation_sessions(is_active);
            `);
            console.log('✅ Table created successfully with raw SQL. Retrying operation...');
            
            // Now retry the operation
            return await retryImpersonation();
          } catch (sqlError) {
            console.error('Failed to create table with raw SQL:', sqlError.message);
            return res.status(500).json({
              success: false,
              message: 'Database table not found and could not be created automatically.',
              error: process.env.NODE_ENV === 'development' ? {
                originalError: error.message,
                syncError: syncError.message,
                sqlError: sqlError.message,
                hint: 'The table creation failed. Please check server logs or run: node server/scripts/createImpersonationTable.js manually.'
              } : undefined
            });
          }
        }
      }
    }
    
    // Check for JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(500).json({
        success: false,
        message: 'Token generation failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error starting impersonation',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
};

// End impersonation session
const endImpersonation = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ImpersonationSession.findOne({
      where: {
        id: sessionId,
        adminUserId: req.user.id,
        isActive: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active impersonation session not found'
      });
    }

    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    // Log the action
    await createAuditLog(
      req.user.id,
      'User Impersonation Ended',
      'Security',
      {
        targetUserId: session.targetUserId,
        details: 'Ended impersonation session',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
      }
    );

    res.status(200).json({
      success: true,
      message: 'Impersonation session ended',
      data: session
    });
  } catch (error) {
    console.error('End impersonation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error ending impersonation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get impersonation sessions
const getImpersonationSessions = async (req, res) => {
  try {
    const { activeOnly = false } = req.query;

    const where = {};
    if (req.user.role !== 'admin') {
      where.adminUserId = req.user.id;
    }
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const sessions = await ImpersonationSession.findAll({
      where,
      include: [
        {
          model: User,
          as: 'adminUser',
          attributes: ['id', 'email']
        },
        {
          model: User,
          as: 'targetUser',
          attributes: ['id', 'email']
        }
      ],
      order: [['startedAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get impersonation sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching impersonation sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  startImpersonation,
  endImpersonation,
  getImpersonationSessions
};

