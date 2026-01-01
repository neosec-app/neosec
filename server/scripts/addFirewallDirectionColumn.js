// Add direction column to firewall_rules table
const { sequelize } = require('../config/db');

async function addDirectionColumn() {
  try {
    console.log(' Adding direction column to firewall_rules table...');

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'firewall_rules'
        AND table_schema = 'public'
        AND column_name = 'direction'
    `);

    if (results.length > 0) {
      console.log(' Direction column already exists');
      return;
    }

    // Add the direction column
    await sequelize.query(`
      ALTER TABLE firewall_rules
      ADD COLUMN direction VARCHAR(255) DEFAULT 'inbound'
    `);

    console.log(' Successfully added direction column to firewall_rules table');

  } catch (error) {
    console.error('XX: Error adding direction column:', error.message);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addDirectionColumn()
    .then(() => {
      console.log(' Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error(' Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addDirectionColumn };
