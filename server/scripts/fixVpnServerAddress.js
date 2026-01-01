/**
 * Script to fix serverAddress column in vpn_configs table
 * Makes it nullable if it's currently NOT NULL
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../config/db');

(async () => {
  try {
    console.log('Checking vpn_configs table structure...');
    
    // Check if serverAddress column exists
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vpn_configs' 
      AND column_name = 'serverAddress'
      AND table_schema = 'public';
    `);
    
    if (columns.length === 0) {
      console.log('serverAddress column does not exist. Adding it...');
      await sequelize.query(`
        ALTER TABLE vpn_configs 
        ADD COLUMN "serverAddress" VARCHAR(255);
      `);
      console.log('✅ Added serverAddress column as nullable');
    } else {
      const column = columns[0];
      console.log(`serverAddress column exists: nullable=${column.is_nullable}`);
      
      if (column.is_nullable === 'NO') {
        console.log('Making serverAddress nullable...');
        await sequelize.query(`
          ALTER TABLE vpn_configs 
          ALTER COLUMN "serverAddress" DROP NOT NULL;
        `);
        console.log('✅ Made serverAddress nullable');
      } else {
        console.log('✅ serverAddress is already nullable');
      }
    }
    
    // Update any existing rows with null serverAddress to have a default value
    await sequelize.query(`
      UPDATE vpn_configs 
      SET "serverAddress" = 'Unknown'
      WHERE "serverAddress" IS NULL;
    `);
    
    console.log('✅ Fixed serverAddress column');
  } catch (error) {
    console.error('Error fixing serverAddress:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();

