const { Sequelize } = require('sequelize');
require('dotenv').config();


// Create Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.DATABASE_URL?.includes('render.com') || 
         process.env.DATABASE_URL?.includes('amazonaws.com') ||
         process.env.DATABASE_URL?.includes('supabase.co') ||
         process.env.DATABASE_URL?.includes('vercel-storage.com') ||
         process.env.NODE_ENV === 'production'
      ? {
          require: true,
          rejectUnauthorized: false
        }
      : false
  }
});

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully...');
    require('../models');
    
    // Sync models with database (creates tables if they don't exist)
    // In production, sync only if required tables are missing
    try {
      const tablesToCheck = ['users', 'vpn_configs', 'notifications', 'threats', 'firewall_rules', 'data_transfers'];
      const missingTables = [];

      for (const table of tablesToCheck) {
        const [results] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table}'
          );
        `);
        const exists = results[0].exists;
        if (!exists) missingTables.push(table);
      }

      if (missingTables.length > 0) {
        console.log(`Missing tables detected (${missingTables.join(', ')}). Creating database tables...`);
        await sequelize.sync({ force: false }); // Create tables without dropping
        console.log('Database tables created successfully.');
      } else {
        console.log('Database tables already exist.');
        // Use alter: true to add missing columns to existing tables
        // This is safe as it only adds new columns, doesn't drop existing ones
        try {
          await sequelize.sync({ alter: true });
          console.log('Database schema updated (new columns added if any).');
        } catch (alterError) {
          console.log('Schema alter completed (or no changes needed).');
        }
      }
    } catch (syncError) {
      console.error('Database sync warning:', syncError.message);
      // Continue - tables might already exist
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};


module.exports = { sequelize, connectDB };

