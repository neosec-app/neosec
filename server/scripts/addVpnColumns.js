// server/scripts/addVpnColumns.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize } = require('../config/db');

(async () => {
  try {
    await sequelize.query('ALTER TABLE vpn_configs ADD COLUMN IF NOT EXISTS "configFileName" VARCHAR;');
    await sequelize.query('ALTER TABLE vpn_configs ADD COLUMN IF NOT EXISTS "configFileContent" TEXT;');
    console.log('✅ Ensured vpn_configs has configFileName and configFileContent');
  } catch (e) {
    console.error('Error adding columns:', e);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
