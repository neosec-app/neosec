// server/scripts/createVpnTable.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize } = require('../config/db');

(async () => {
  try {
    console.log('Creating vpn_configs table if missing...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS public.vpn_configs (
        id UUID PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        protocol VARCHAR(32) NOT NULL DEFAULT 'OpenVPN',
        configFileName VARCHAR NOT NULL DEFAULT '',
        configFileContent TEXT NOT NULL DEFAULT '',
        description TEXT,
        isActive BOOLEAN DEFAULT false,
        "userId" UUID NOT NULL,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
        "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
      );
    `);

    // Try to add FK to users if users table exists
    try {
      await sequelize.query(`
        ALTER TABLE public.vpn_configs
        ADD CONSTRAINT IF NOT EXISTS fk_vpn_user
        FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;
      `);
    } catch (fkErr) {
      console.warn('Could not add foreign key constraint (it may already exist or users table missing):', fkErr.message || fkErr);
    }

    console.log('✅ createVpnTable: completed');
  } catch (e) {
    console.error('Error creating table:', e);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
