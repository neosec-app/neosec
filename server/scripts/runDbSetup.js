// server/scripts/runDbSetup.js
// Safe deployment-time DB setup: creates vpn_configs table and ensures columns exist.
// This script intentionally never fails the deploy (logs errors but exits 0).

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize } = require('../config/db');

(async () => {
  try {
    console.log('[runDbSetup] Starting deployment DB setup...');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name = 'vpn_configs';
    `);

    if (tables.length === 0) {
      console.log('[runDbSetup] vpn_configs table not found - creating...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS public.vpn_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

      // Attempt to add FK if users table exists
      try {
        await sequelize.query(`
          ALTER TABLE public.vpn_configs
          ADD CONSTRAINT IF NOT EXISTS fk_vpn_user
          FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;
        `);
      } catch (fkErr) {
        console.warn('[runDbSetup] Could not add FK constraint:', fkErr.message || fkErr);
      }

      console.log('[runDbSetup] vpn_configs created');
    } else {
      console.log('[runDbSetup] vpn_configs table already exists in schema(s):', tables.map(t => t.table_schema));
    }

    // Ensure columns exist (idempotent)
    await sequelize.query('ALTER TABLE public.vpn_configs ADD COLUMN IF NOT EXISTS "configFileName" VARCHAR;');
    await sequelize.query('ALTER TABLE public.vpn_configs ADD COLUMN IF NOT EXISTS "configFileContent" TEXT;');
    console.log('[runDbSetup] Ensured configFileName and configFileContent columns exist');

    console.log('[runDbSetup] DB setup complete');
  } catch (e) {
    console.error('[runDbSetup] Error during DB setup (logged but will not fail deploy):', e);
  } finally {
    try { await sequelize.close(); } catch (e) { /* ignore */ }
    // IMPORTANT: Do not fail the deploy in case of transient DB issues; exit 0
    process.exit(0);
  }
})();
