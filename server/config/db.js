// server/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProd = process.env.NODE_ENV === "production";

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: !isProd,  // Log only in development
    dialectOptions: {
        ssl: process.env.DATABASE_URL?.includes('render.com') ||
        process.env.DATABASE_URL?.includes('amazonaws.com') ||
        process.env.DATABASE_URL?.includes('supabase.co') ||
        isProd
            ? { require: true, rejectUnauthorized: false }
            : false
    }
});

// Database connection + model synchronization
const connectDB = async () => {
    try {
        // Test connection
        await sequelize.authenticate();
        console.log("Database connected successfully...");

        // Check if users table exists
        const [results] = await sequelize.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'users'
            );
        `);

        const tableExists = results[0].exists;

        if (!tableExists) {
            // First-time setup: create all tables
            console.log("No tables found. Creating all database tables...");
            await sequelize.sync({ force: false });
            console.log("Database tables created successfully.");
        } else {
            console.log("Tables already exist.");

            if (!isProd) {
                // Development: auto-update schema safely
                console.log("Syncing database schema (alter mode)...");
                await sequelize.sync({ alter: true });
                console.log("Database schema updated.");
            } else {
                // Production: never auto-alter tables
                console.log("Production mode: No schema changes applied.");
            }
        }
    } catch (err) {
        console.error("Database connection/sync error:", err.message);
        console.error(err);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
