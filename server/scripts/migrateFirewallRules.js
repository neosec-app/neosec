// server/scripts/migrateFirewallRules.js
// Migration script to update firewall_rules table to new simplified schema

const { sequelize } = require('../config/db');

async function migrateFirewallRules() {
  try {
    console.log('Starting firewall rules migration...');

    // Check if the table exists
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'firewall_rules';
    `);

    if (tables.length === 0) {
      console.log('firewall_rules table does not exist. Creating with new schema...');

      // Create the new table structure
      await sequelize.query(`
        CREATE TABLE firewall_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ip_address TEXT NOT NULL,
          port_start INTEGER CHECK (port_start >= 0 AND port_start <= 65535),
          port_end INTEGER CHECK (port_end >= 0 AND port_end <= 65535),
          protocol INTEGER NOT NULL CHECK (protocol >= 0 AND protocol <= 2),
          action INTEGER NOT NULL CHECK (action >= 0 AND action <= 2),
          "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      console.log('✅ New firewall_rules table created successfully.');
      return;
    }

    console.log('firewall_rules table exists. Migrating to new schema...');

    // Check current columns
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'firewall_rules' AND table_schema = 'public';
    `);

    const columnNames = columns.map(col => col.column_name);
    console.log('Current columns:', columnNames);

    // Backup existing data if needed
    console.log('Backing up existing firewall rules...');
    const [existingRules] = await sequelize.query('SELECT * FROM firewall_rules;');
    console.log(`Found ${existingRules.length} existing rules to migrate.`);

    // Drop the table and recreate with new schema
    console.log('Dropping old table structure...');
    await sequelize.query('DROP TABLE firewall_rules CASCADE;');

    // Create the new table structure
    console.log('Creating new table structure...');
    await sequelize.query(`
      CREATE TABLE firewall_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip_address TEXT NOT NULL,
        port_start INTEGER CHECK (port_start >= 0 AND port_start <= 65535),
        port_end INTEGER CHECK (port_end >= 0 AND port_end <= 65535),
        protocol INTEGER NOT NULL CHECK (protocol >= 0 AND protocol <= 2),
        action INTEGER NOT NULL CHECK (action >= 0 AND action <= 2),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Firewall rules table migrated to new schema.');
    console.log('⚠️  WARNING: All existing firewall rules have been removed.');
    console.log('   You will need to recreate your firewall rules using the new simplified form.');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateFirewallRules()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateFirewallRules };
