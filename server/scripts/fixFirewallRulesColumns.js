// server/scripts/fixFirewallRulesColumns.js
// Script to fix firewall_rules table column names if they don't match the expected schema

const { sequelize } = require('../config/db');

async function fixFirewallRulesColumns() {
  try {
    console.log('Checking firewall_rules table columns...');

    // Check if the table exists
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'firewall_rules';
    `);

    if (tables.length === 0) {
      console.log('firewall_rules table does not exist. Creating it...');
      
      // Create the table with correct schema
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
      
      console.log('✅ firewall_rules table created successfully.');
      return;
    }

    // Get current columns
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'firewall_rules' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const columnNames = columns.map(col => col.column_name);
    console.log('Current columns:', columnNames);
    
    // Clean up any leftover temporary columns from previous failed migrations
    if (columnNames.includes('protocol_new')) {
      console.log('⚠️  Found leftover protocol_new column. Cleaning up...');
      try {
        // If protocol column exists and is INTEGER, drop protocol_new
        const protocolCol = columns.find(col => col.column_name === 'protocol');
        if (protocolCol && protocolCol.data_type === 'integer') {
          await sequelize.query(`ALTER TABLE firewall_rules DROP COLUMN IF EXISTS protocol_new;`);
          console.log('✅ Cleaned up protocol_new column');
        } else {
          // If protocol is still ENUM, rename protocol_new to protocol
          await sequelize.query(`ALTER TABLE firewall_rules DROP COLUMN IF EXISTS protocol;`);
          await sequelize.query(`ALTER TABLE firewall_rules RENAME COLUMN protocol_new TO protocol;`);
          await sequelize.query(`ALTER TABLE firewall_rules ALTER COLUMN protocol SET NOT NULL;`);
          await sequelize.query(`ALTER TABLE firewall_rules ADD CONSTRAINT protocol_check CHECK (protocol >= 0 AND protocol <= 2);`);
          console.log('✅ Migrated protocol_new to protocol');
        }
      } catch (cleanupError) {
        console.warn('⚠️  Could not clean up protocol_new:', cleanupError.message);
      }
    }
    
    if (columnNames.includes('action_new')) {
      console.log('⚠️  Found leftover action_new column. Cleaning up...');
      try {
        // If action column exists and is INTEGER, drop action_new
        const actionCol = columns.find(col => col.column_name === 'action');
        if (actionCol && actionCol.data_type === 'integer') {
          await sequelize.query(`ALTER TABLE firewall_rules DROP COLUMN IF EXISTS action_new;`);
          console.log('✅ Cleaned up action_new column');
        } else {
          // If action is still ENUM, rename action_new to action
          // First, set any NULL values to 0 (ACCEPT)
          await sequelize.query(`UPDATE firewall_rules SET action_new = 0 WHERE action_new IS NULL;`);
          await sequelize.query(`ALTER TABLE firewall_rules DROP COLUMN IF EXISTS action;`);
          await sequelize.query(`ALTER TABLE firewall_rules RENAME COLUMN action_new TO action;`);
          await sequelize.query(`ALTER TABLE firewall_rules ALTER COLUMN action SET NOT NULL;`);
          await sequelize.query(`ALTER TABLE firewall_rules ADD CONSTRAINT action_check CHECK (action >= 0 AND action <= 2);`);
          console.log('✅ Migrated action_new to action');
        }
      } catch (cleanupError) {
        console.warn('⚠️  Could not clean up action_new:', cleanupError.message);
      }
    }
    
    // Refresh columns after cleanup
    const [columnsAfterCleanup] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'firewall_rules' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    // Update columns variable with cleaned up data
    columns.length = 0;
    columns.push(...columnsAfterCleanup);

    // Check if ip_address column exists (with underscore)
    const hasIpAddress = columnNames.includes('ip_address');
    const hasIpAddressCamel = columnNames.includes('ipAddress');

    if (!hasIpAddress && hasIpAddressCamel) {
      console.log('⚠️  Found ipAddress (camelCase) but need ip_address (snake_case). Renaming...');
      
      // Rename the column
      await sequelize.query(`
        ALTER TABLE firewall_rules 
        RENAME COLUMN "ipAddress" TO ip_address;
      `);
      
      console.log('✅ Renamed ipAddress to ip_address');
    } else if (!hasIpAddress && !hasIpAddressCamel) {
      console.log('⚠️  ip_address column is missing. Adding it...');
      
      // Add the missing column
      await sequelize.query(`
        ALTER TABLE firewall_rules 
        ADD COLUMN ip_address TEXT;
      `);
      
      // If there's data, you might want to migrate it from another column
      // For now, we'll set a default or leave it null
      console.log('⚠️  Note: ip_address column added but may be empty. Existing data may need migration.');
    }

    // Check and fix port_start
    const hasPortStart = columnNames.includes('port_start');
    const hasPortStartCamel = columnNames.includes('portStart');
    
    if (!hasPortStart && hasPortStartCamel) {
      console.log('⚠️  Found portStart (camelCase) but need port_start (snake_case). Renaming...');
      await sequelize.query(`
        ALTER TABLE firewall_rules 
        RENAME COLUMN "portStart" TO port_start;
      `);
      console.log('✅ Renamed portStart to port_start');
    } else if (!hasPortStart && !hasPortStartCamel) {
      console.log('⚠️  port_start column is missing. Adding it...');
      await sequelize.query(`
        ALTER TABLE firewall_rules 
        ADD COLUMN port_start INTEGER CHECK (port_start >= 0 AND port_start <= 65535);
      `);
    }

    // Check and fix port_end
    const hasPortEnd = columnNames.includes('port_end');
    const hasPortEndCamel = columnNames.includes('portEnd');
    
    if (!hasPortEnd && hasPortEndCamel) {
      console.log('⚠️  Found portEnd (camelCase) but need port_end (snake_case). Renaming...');
      await sequelize.query(`
        ALTER TABLE firewall_rules 
        RENAME COLUMN "portEnd" TO port_end;
      `);
      console.log('✅ Renamed portEnd to port_end');
    } else if (!hasPortEnd && !hasPortEndCamel) {
      console.log('⚠️  port_end column is missing. Adding it...');
      await sequelize.query(`
        ALTER TABLE firewall_rules 
        ADD COLUMN port_end INTEGER CHECK (port_end >= 0 AND port_end <= 65535);
      `);
    }

    // Check and fix protocol column type (should be INTEGER, not ENUM)
    const protocolColumn = columns.find(col => col.column_name === 'protocol');
    if (protocolColumn && protocolColumn.data_type === 'USER-DEFINED') {
      console.log('⚠️  protocol column is ENUM type. Converting to INTEGER...');
      try {
        // Check if constraint exists and drop it
        await sequelize.query(`
          DO $$ 
          BEGIN
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocol_check') THEN
              ALTER TABLE firewall_rules DROP CONSTRAINT protocol_check;
            END IF;
          END $$;
        `);
        
        // First, add a temporary INTEGER column
        await sequelize.query(`
          ALTER TABLE firewall_rules 
          ADD COLUMN IF NOT EXISTS protocol_new INTEGER;
        `);
        
        // Copy data (convert ENUM values to integers)
        await sequelize.query(`
          UPDATE firewall_rules 
          SET protocol_new = CASE 
            WHEN protocol::text = 'tcp' OR protocol::text = 'TCP' THEN 0
            WHEN protocol::text = 'udp' OR protocol::text = 'UDP' THEN 1
            WHEN protocol::text = 'both' OR protocol::text = 'BOTH' THEN 2
            ELSE COALESCE(protocol::text::integer, 0)
          END;
        `);
        
        // Drop old column
        await sequelize.query(`
          ALTER TABLE firewall_rules 
          DROP COLUMN protocol;
        `);
        
        // Rename new column
        await sequelize.query(`
          ALTER TABLE firewall_rules 
          RENAME COLUMN protocol_new TO protocol;
        `);
        
        // Add NOT NULL constraint and check
        await sequelize.query(`
          ALTER TABLE firewall_rules 
          ALTER COLUMN protocol SET NOT NULL,
          ADD CONSTRAINT protocol_check CHECK (protocol >= 0 AND protocol <= 2);
        `);
        
        console.log('✅ protocol column converted to INTEGER');
      } catch (convError) {
        console.error('⚠️  Error converting protocol column:', convError.message);
        console.error('Conversion error stack:', convError.stack);
      }
    }
    
    // Check and fix action column type (should be INTEGER, not ENUM)
    const actionColumn = columns.find(col => col.column_name === 'action');
    if (actionColumn && actionColumn.data_type === 'USER-DEFINED') {
      console.log('⚠️  action column is ENUM type. Converting to INTEGER...');
      try {
        // Check if constraint exists and drop it
        await sequelize.query(`
          DO $$ 
          BEGIN
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_check') THEN
              ALTER TABLE firewall_rules DROP CONSTRAINT action_check;
            END IF;
          END $$;
        `);
        
        // First, add a temporary INTEGER column
        await sequelize.query(`
          ALTER TABLE firewall_rules 
          ADD COLUMN IF NOT EXISTS action_new INTEGER;
        `);
        
        // Copy data (convert ENUM values to integers)
        // Handle 'deny' as DROP (2), and other known values
        // Set NULL values to 0 (ACCEPT) as default
        await sequelize.query(`
          UPDATE firewall_rules 
          SET action_new = CASE 
            WHEN action::text = 'accept' OR action::text = 'ACCEPT' THEN 0
            WHEN action::text = 'reject' OR action::text = 'REJECT' THEN 1
            WHEN action::text = 'drop' OR action::text = 'DROP' OR action::text = 'deny' OR action::text = 'DENY' THEN 2
            WHEN action IS NULL THEN 0
            ELSE COALESCE(action::text::integer, 0)
          END;
        `);
        
        // Drop old column
        await sequelize.query(`
          ALTER TABLE firewall_rules 
          DROP COLUMN action;
        `);
        
        // Rename new column
        await sequelize.query(`
          ALTER TABLE firewall_rules 
          RENAME COLUMN action_new TO action;
        `);
        
        // Add NOT NULL constraint and check
        await sequelize.query(`
          ALTER TABLE firewall_rules 
          ALTER COLUMN action SET NOT NULL,
          ADD CONSTRAINT action_check CHECK (action >= 0 AND action <= 2);
        `);
        
        console.log('✅ action column converted to INTEGER');
      } catch (convError) {
        console.error('⚠️  Error converting action column:', convError.message);
        console.error('Conversion error stack:', convError.stack);
      }
    }

    // Verify final state
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'firewall_rules' AND table_schema = 'public';
    `);
    
    const finalColumnNames = finalColumns.map(col => col.column_name);
    console.log('✅ Final columns:', finalColumnNames);
    
    if (finalColumnNames.includes('ip_address')) {
      console.log('✅ firewall_rules table is now correctly configured!');
    } else {
      console.error('❌ Error: ip_address column still missing after fix attempt.');
    }

  } catch (error) {
    console.error('❌ Error fixing firewall_rules columns:', error);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixFirewallRulesColumns()
    .then(() => {
      console.log('✅ Column fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Column fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixFirewallRulesColumns };


