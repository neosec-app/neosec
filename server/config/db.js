// server/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

// ---- Sequelize instance ----
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    // from both files: log in dev, disable in prod
    logging: isProd ? false : console.log,
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
        ];

        const missingTables = await getMissingTables(tablesToCheck);

        // If anything missing, create tables without dropping anything
        if (missingTables.length > 0) {
            console.log(
                `Missing tables detected (${missingTables.join(', ')}). Creating database tables...`
            );
            await sequelize.sync({ force: false });
            console.log('Database tables created successfully.');
        } else {
            console.log('Database tables already exist.');
        }

        // 5) Schema sync behavior
        if (!isProd) {
            // Development: auto-update schema safely
            console.log('Syncing database schema (alter mode)...');
            await sequelize.sync({ alter: true });
            console.log('Database schema updated (new columns added if any).');
        } else {
            // Production: never auto-alter tables
            console.log('Production mode: No schema changes applied.');
        }
    } catch (err) {
        console.error('Database connection/sync error:', err.message);
        console.error(err);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
