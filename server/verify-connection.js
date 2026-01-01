/**
 * Simple script to verify database connection string format
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Get connection string
const dbUrl = process.env.DATABASE_URL || 'postgresql://neosec_backend_user:XEPoMnQlgRGi7x81T8YzDmEhE1bZuKlw@dpg-d4q92rje5dus73ejkmt0-a/neosec_backend';

console.log('🔍 Verifying Database Connection String...\n');
console.log('Connection String:', dbUrl.replace(/:[^:@]+@/, ':****@')); // Hide password

// Parse connection string
try {
  const url = new URL(dbUrl);
  console.log('\n📋 Parsed Components:');
  console.log('   Protocol:', url.protocol);
  console.log('   Username:', url.username);
  console.log('   Password:', url.password ? '****' : 'Not set');
  console.log('   Hostname:', url.hostname);
  console.log('   Port:', url.port || 'Not specified (default: 5432)');
  console.log('   Database:', url.pathname.replace('/', ''));
  
  // Check if hostname looks incomplete
  if (url.hostname.includes('dpg-') && !url.hostname.includes('render.com') && !url.hostname.includes('.')) {
    console.log('\n⚠️  WARNING: Hostname might be incomplete!');
    console.log('   Render.com databases typically need full hostname like:');
    console.log('   dpg-xxxxx-a.oregon-postgres.render.com');
    console.log('   or');
    console.log('   dpg-xxxxx-a.singapore-postgres.render.com');
  }
  
  // Check if port is missing
  if (!url.port) {
    console.log('\n⚠️  WARNING: Port not specified, will use default 5432');
  }
  
  console.log('\n✅ Connection string format is valid');
  console.log('\n💡 Next: Try connecting to verify network access...');
  
} catch (error) {
  console.error('\n❌ Invalid connection string format:', error.message);
  console.log('\nExpected format:');
  console.log('postgresql://username:password@hostname:port/database');
}

