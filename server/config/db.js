// server/config/db.js
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isProd = process.env.NODE_ENV === 'production';

// Validate DATABASE_URL before creating Sequelize instance
if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set in environment variables!');
    console.error('Please check your .env file in the server directory.');
    throw new Error('DATABASE_URL environment variable is required');
}

// ---- Sequelize instance ----
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    // from both files: log in dev, disable in prod
    logging: isProd ? false : console.log,
    // Use snake_case for column names to match database schema
    define: {
        underscored: true,
    },
    dialectOptions: {
        ssl:
            process.env.DATABASE_URL?.includes('render.com') ||
            process.env.DATABASE_URL?.includes('amazonaws.com') ||
            process.env.DATABASE_URL?.includes('supabase.co') ||
            process.env.DATABASE_URL?.includes('vercel-storage.com') ||
            isProd
                ? { require: true, rejectUnauthorized: false }
                : false,
    },
});

// ---- helpers ----
async function tableExists(tableName) {
    const [results] = await sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
    );
  `);
    return results?.[0]?.exists === true;
}

async function getMissingTables(tables) {
    const missing = [];
    for (const table of tables) {
        const exists = await tableExists(table);
        if (!exists) missing.push(table);
    }
    return missing;
}

// ---- connectDB ----
const connectDB = async () => {
    try {
        // 1) Test connection
        await sequelize.authenticate();
        console.log('Database connected successfully...');

        // 2) Ensure models are loaded/registered (from 2nd file)
        require('../models');

        // 3) Check if "users" table exists (from both files)
        const usersTableExists = await tableExists('users');

        if (!usersTableExists) {
            // First-time setup: create all tables
            console.log('No tables found (users missing). Creating all database tables...');
            await sequelize.sync({ force: false });
            console.log('Database tables created successfully.');
            return;
        }

        console.log('Users table exists. Checking remaining tables...');

        // 4) Full set check (from 2nd file)
        const tablesToCheck = [
            'users',
            'vpn_configs',
            'notifications',
            'threats',
            'firewall_rules',
            'data_transfers',
            'groups',
            'invitations',
            'group_members',
            'subscriptions',
            'profiles',
            'profile_logs',
            'audit_logs',
            'devices',
            'login_history',
            'feature_toggles',
            'role_templates',
            'mfa_settings',
            'impersonation_sessions',
            'blocklist_ips',
            'activity_logs'
        ];

        const missingTables = await getMissingTables(tablesToCheck);

        // If anything missing, create tables without dropping anything
        if (missingTables.length > 0) {
            console.log(
                `Missing tables detected (${missingTables.join(', ')}). Creating database tables...`
            );
            // Sync will create missing tables and update schema
            await sequelize.sync({ force: false, alter: false });
            console.log('Database tables created successfully.');
            
            // Verify all tables now exist
            const stillMissing = await getMissingTables(tablesToCheck);
            if (stillMissing.length > 0) {
                console.warn(`Warning: Some tables still missing after sync: ${stillMissing.join(', ')}`);
                // Try sync with alter mode as fallback
                console.log('Attempting to create remaining tables with alter mode...');
                await sequelize.sync({ force: false, alter: true });
                const finalCheck = await getMissingTables(tablesToCheck);
                if (finalCheck.length > 0) {
                    console.error(`Error: Could not create tables: ${finalCheck.join(', ')}`);
                } else {
                    console.log('All tables created successfully.');
                }
            }
        } else {
            console.log('Database tables already exist.');
        }

        // 5) Check and add missing columns to users table
        try {
            const [columns] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND table_schema = 'public';
            `);
            const columnNames = columns.map(col => col.column_name);
            
            // Check for missing columns and add them
            const missingColumns = [];
            if (!columnNames.includes('accountType')) missingColumns.push('accountType');
            if (!columnNames.includes('subscriptionTier')) missingColumns.push('subscriptionTier');
            if (!columnNames.includes('isPaid')) missingColumns.push('isPaid');
            
            if (missingColumns.length > 0) {
                console.log(`Missing columns detected: ${missingColumns.join(', ')}. Adding them...`);
                
                // Create ENUM types if they don't exist
                await sequelize.query(`
                    DO $$ BEGIN
                        CREATE TYPE account_type_enum AS ENUM ('user', 'leader', 'admin');
                    EXCEPTION
                        WHEN duplicate_object THEN null;
                    END $$;
                `);
                
                await sequelize.query(`
                    DO $$ BEGIN
                        CREATE TYPE subscription_tier_enum AS ENUM ('free', 'basic', 'pro', 'enterprise');
                    EXCEPTION
                        WHEN duplicate_object THEN null;
                    END $$;
                `);
                
                // Add missing columns
                if (missingColumns.includes('accountType')) {
                    await sequelize.query(`
                        ALTER TABLE users 
                        ADD COLUMN IF NOT EXISTS "accountType" account_type_enum DEFAULT 'user' NOT NULL;
                    `);
                }
                
                if (missingColumns.includes('subscriptionTier')) {
                    await sequelize.query(`
                        ALTER TABLE users 
                        ADD COLUMN IF NOT EXISTS "subscriptionTier" subscription_tier_enum DEFAULT 'free' NOT NULL;
                    `);
                }
                
                if (missingColumns.includes('isPaid')) {
                    await sequelize.query(`
                        ALTER TABLE users 
                        ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false;
                    `);
                }
                
                // Update existing users with default values
                await sequelize.query(`
                    UPDATE users 
                    SET 
                        "accountType" = COALESCE("accountType", 'user'),
                        "subscriptionTier" = COALESCE("subscriptionTier", 'free'),
                        "isPaid" = COALESCE("isPaid", false)
                    WHERE "accountType" IS NULL OR "subscriptionTier" IS NULL OR "isPaid" IS NULL;
                `);
                
                console.log('✅ Missing columns added successfully.');
            } else {
                console.log('✅ All required columns exist in users table.');
            }
        } catch (colError) {
            console.error('Error checking/adding columns:', colError.message);
            // Don't fail the entire connection if column check fails
        }

        // 6) Fix firewall_rules table columns if needed
        try {
            const { fixFirewallRulesColumns } = require('../scripts/fixFirewallRulesColumns');
            await fixFirewallRulesColumns();
        } catch (fixError) {
            console.error('Error fixing firewall_rules columns:', fixError.message);
            // Don't fail the entire connection if column fix fails
        }

        // 7) Schema sync behavior
        if (!isProd) {
            // Development: auto-update schema safely
            console.log('Syncing database schema (alter mode)...');
            await sequelize.sync();
            console.log('Database schema updated (new columns added if any).');
        } else {
            // Production: columns are now handled above
            console.log('Production mode: Schema check completed.');
        }
    } catch (err) {
        console.error('Database connection/sync error:', err.message);
        console.error('Full error:', err);
        console.error('Error stack:', err.stack);
        // Don't exit in production - let the server start and log errors
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};

module.exports = { sequelize, connectDB };
