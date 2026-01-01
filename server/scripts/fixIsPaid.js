// Fix isPaid field for users with active subscriptions
const { sequelize } = require('../config/db');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Load associations
require('../models/associations');

async function fixIsPaid() {
  try {
    console.log('🔧 Fixing isPaid field for users with active subscriptions...');

    const usersWithSubscriptions = await User.findAll({
      include: [{
        model: Subscription,
        as: 'subscription',
        where: { status: 'active' },
        required: true
      }]
    });

    console.log(`Found ${usersWithSubscriptions.length} users with active subscriptions`);

    let updatedCount = 0;
    for (const user of usersWithSubscriptions) {
      if (!user.isPaid) {
        console.log(`Setting isPaid=true for user ${user.email}`);
        await user.update({ isPaid: true });
        updatedCount++;
      }
    }

    console.log(`✅ Fixed isPaid for ${updatedCount} users`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (sequelize && sequelize.close) {
      await sequelize.close();
    }
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixIsPaid();
}

module.exports = { fixIsPaid };
