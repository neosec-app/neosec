// server/scripts/migrate-user-fields.js

const { sequelize } = require('../config/db');

async function migrateDatabase() {
    try {
        console.log('🔄 Starting database migration...');

        // Add new columns to users table
        await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "accountType" VARCHAR(255) DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS "subscriptionTier" VARCHAR(255) DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false;
    `);

        console.log('✅ Successfully added new columns to users table');

        // Create ENUM types if they don't exist
        await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE account_type_enum AS ENUM ('user', 'leader', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_tier_enum AS ENUM ('free', 'basic', 'pro', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        console.log('✅ ENUM types created/verified');

        // Update existing users to have default values
        await sequelize.query(`
      UPDATE users 
      SET 
        "accountType" = 'user',
        "subscriptionTier" = 'free',
        "isPaid" = false
      WHERE "accountType" IS NULL;
    `);

        console.log('✅ Updated existing users with default values');

        // Optional: Make first user an admin and leader for testing
        const [results] = await sequelize.query(`
      SELECT id, email FROM users ORDER BY "createdAt" ASC LIMIT 1;
    `);

        if (results.length > 0) {
            const firstUser = results[0];
            await sequelize.query(`
        UPDATE users 
        SET 
          role = 'admin',
          "accountType" = 'leader',
          "subscriptionTier" = 'pro',
          "isPaid" = true,
          "isApproved" = true
        WHERE id = '${firstUser.id}';
      `);
            console.log(`✅ First user (${firstUser.email}) upgraded to Admin Leader`);
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateDatabase();