/**
 * Test script to verify impersonation feature setup
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Set DATABASE_URL if not in environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://neosec_backend_user:XEPoMnQlgRGi7x81T8YzDmEhE1bZuKlw@dpg-d4q92rje5dus73ejkmt0-a/neosec_backend';
}

const { sequelize, connectDB } = require('./config/db');
const ImpersonationSession = require('./models/ImpersonationSession');
const User = require('./models/User');

async function testImpersonationSetup() {
  console.log('🔍 Testing Impersonation Feature Setup...\n');

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    await connectDB();
    console.log('   ✅ Database connected\n');

    // 2. Check if JWT_SECRET is set
    console.log('2. Checking JWT_SECRET...');
    if (!process.env.JWT_SECRET) {
      console.log('   ❌ JWT_SECRET is NOT set!');
      console.log('   💡 Set JWT_SECRET in your .env file or environment variables\n');
    } else {
      console.log('   ✅ JWT_SECRET is set\n');
    }

    // 3. Check if impersonation_sessions table exists
    console.log('3. Checking impersonation_sessions table...');
    try {
      const [results] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'impersonation_sessions'
        );
      `);
      
      const tableExists = results?.[0]?.exists === true;
      if (tableExists) {
        console.log('   ✅ Table exists\n');
      } else {
        console.log('   ❌ Table does NOT exist!');
        console.log('   💡 Restart the server to create tables automatically\n');
      }
    } catch (error) {
      console.log('   ⚠️  Could not check table:', error.message);
      console.log('   💡 This might be a database connection issue\n');
    }

    // 4. Test model associations
    console.log('4. Testing model associations...');
    try {
      // Try to find a user to test associations
      const testUser = await User.findOne({ limit: 1 });
      if (testUser) {
        console.log('   ✅ User model is accessible');
        
        // Test if we can query impersonation sessions
        const sessions = await ImpersonationSession.findAll({ limit: 1 });
        console.log('   ✅ ImpersonationSession model is accessible');
        console.log(`   ✅ Found ${sessions.length} existing sessions\n`);
      } else {
        console.log('   ⚠️  No users found in database');
        console.log('   💡 Create a user first to test impersonation\n');
      }
    } catch (error) {
      console.log('   ❌ Error testing associations:', error.message);
      if (error.name === 'SequelizeDatabaseError') {
        console.log('   💡 This might indicate the table needs to be created\n');
      }
    }

    // 5. Check required environment variables
    console.log('5. Environment variables check:');
    console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log('If you see errors above, fix them before using impersonation.');
    console.log('\nCommon fixes:');
    console.log('1. Set JWT_SECRET in your .env file');
    console.log('2. Ensure DATABASE_URL is correct');
    console.log('3. Restart the server to create missing tables');
    console.log('4. Check server logs for detailed error messages\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testImpersonationSetup();

