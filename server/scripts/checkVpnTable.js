// server/scripts/checkVpnTable.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize } = require('../config/db');

(async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name = 'vpn_configs';
    `);

    if (results.length === 0) {
      console.log('vpn_configs table NOT FOUND');
    } else {
      console.log('vpn_configs table found in schema(s):', results.map(r => r.table_schema));
    }
  } catch (e) {
    console.error('Error checking tables:', e);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
