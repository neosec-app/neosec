// server/scripts/checkVpnColumns.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize } = require('../config/db');

(async () => {
  try {
    const [cols] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name='vpn_configs' AND table_schema='public';");
    console.log('vpn_configs columns:', cols.map(c => c.column_name));
  } catch (e) {
    console.error('Error listing columns:', e);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
