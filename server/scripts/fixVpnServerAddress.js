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
    
    // Check if port column exists
    const [portColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vpn_configs' 
      AND column_name = 'port'
      AND table_schema = 'public';
    `);
    
    if (portColumns.length === 0) {
      console.log('port column does not exist. Adding it...');
      await sequelize.query(`
        ALTER TABLE vpn_configs 
        ADD COLUMN port INTEGER;
      `);
      console.log('✅ Added port column as nullable');
    } else {
      const portColumn = portColumns[0];
      if (portColumn.is_nullable === 'NO') {
        console.log('Making port column nullable...');
        await sequelize.query(`
          ALTER TABLE vpn_configs 
          ALTER COLUMN port DROP NOT NULL;
        `);
        console.log('✅ Made port column nullable');
      } else {
        console.log('✅ port is already nullable');
      }
    }
    
    // Update any existing rows with null serverAddress to have a default value
    await sequelize.query(`
      UPDATE vpn_configs 
      SET "serverAddress" = 'Unknown'
      WHERE "serverAddress" IS NULL;
    `);
    
    // Update any existing rows with null port to have a default value
    await sequelize.query(`
      UPDATE vpn_configs 
      SET port = 0
      WHERE port IS NULL;
    `);
    
    console.log('✅ Fixed serverAddress and port columns');
  } catch (error) {
    console.error('Error fixing serverAddress:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();

