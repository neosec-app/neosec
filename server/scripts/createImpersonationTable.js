/**
 * Script to create impersonation_sessions table if it doesn't exist
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { sequelize, connectDB } = require('../config/db');
const ImpersonationSession = require('../models/ImpersonationSession');

async function createImpersonationTable() {
  try {
    console.log('🔍 Checking impersonation_sessions table...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');

    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'impersonation_sessions'
      );
    `);

    const tableExists = results?.[0]?.exists === true;

    if (tableExists) {
      console.log('✅ Table impersonation_sessions already exists\n');
      
      // Verify structure
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'impersonation_sessions'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      console.log('');
    } else {
      console.log('⚠️  Table does not exist. Creating it now...\n');
      
      // Sync the model to create the table
      await ImpersonationSession.sync({ force: false, alter: false });
      console.log('✅ Table impersonation_sessions created successfully\n');
    }

    // Test that we can query the table
    const count = await ImpersonationSession.count();
    console.log(`✅ Table is accessible (${count} existing sessions)\n`);

    console.log('🎉 Impersonation table setup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createImpersonationTable();

