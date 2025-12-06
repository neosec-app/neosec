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
    
    // Sync models with database (creates tables if they don't exist)
    // In production, sync only if tables don't exist (safer than alter)
    try {
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
        console.log('Tables not found. Creating database tables...');
        await sequelize.sync({ force: false }); // Create tables without dropping
        console.log('Database tables created successfully.');
      } else {
        console.log('Database tables already exist.');
      }
    } catch (syncError) {
      // If sync fails, log but don't crash (tables might already exist)
      console.error('Database sync warning:', syncError.message);
      // Try to continue anyway - tables might already exist
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

