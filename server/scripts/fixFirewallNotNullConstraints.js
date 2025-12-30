// Fix NOT NULL constraints on old columns that aren't used in the simplified schema
const { sequelize } = require('../config/db');

async function fixNotNullConstraints() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    // List of old columns that might have NOT NULL constraints but aren't used
    const columnsToFix = [
      'direction',
      'description',
      'sourceIP',
      'destinationIP',
      'sourcePort',
      'destinationPort',
      'order',
      'enabled'
    ];
    
    // Check which columns exist and have NOT NULL constraints
    const [columns] = await sequelize.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'firewall_rules' 
      AND table_schema = 'public'
      AND column_name = ANY($1);
    `, {
      bind: [columnsToFix]
    });
    
    console.log('\nColumns to check:', columns.map(c => `${c.column_name} (nullable: ${c.is_nullable})`));
    
    // Fix NOT NULL constraints
    for (const col of columns) {
      if (col.is_nullable === 'NO') {
        const columnName = col.column_name === 'order' ? '"order"' : col.column_name;
        try {
          await sequelize.query(`
            ALTER TABLE firewall_rules 
            ALTER COLUMN ${columnName} DROP NOT NULL;
          `);
          console.log(`✅ Fixed NOT NULL constraint on ${col.column_name}`);
        } catch (error) {
          console.error(`❌ Failed to fix ${col.column_name}:`, error.message);
        }
      }
    }
    
    // Also ensure action and ip_address can be null (they should be NOT NULL for our schema, but let's check)
    // Actually, ip_address should be NOT NULL, but let's make sure action is NOT NULL
    try {
      await sequelize.query(`
        ALTER TABLE firewall_rules 
        ALTER COLUMN action SET NOT NULL;
      `);
      console.log('✅ Set action to NOT NULL');
    } catch (error) {
      console.warn('⚠️  Could not set action to NOT NULL:', error.message);
    }
    
    try {
      await sequelize.query(`
        ALTER TABLE firewall_rules 
        ALTER COLUMN ip_address SET NOT NULL;
      `);
      console.log('✅ Set ip_address to NOT NULL');
    } catch (error) {
      console.warn('⚠️  Could not set ip_address to NOT NULL:', error.message);
    }
    
    console.log('\n✅ All NOT NULL constraints fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixNotNullConstraints();

