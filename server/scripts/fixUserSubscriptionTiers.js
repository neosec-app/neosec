// Fix subscription tiers for existing users
const { sequelize } = require('../config/db');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Load associations
require('../models/associations');

async function fixUserSubscriptionTiers() {
  try {
    console.log('🔧 Fixing user subscription tiers...');

    // Find all users who have active subscriptions but might have incorrect subscriptionTier
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
      const activeSubscription = user.subscription;

      if (activeSubscription && user.subscriptionTier !== activeSubscription.tier) {
        console.log(`Updating user ${user.email}: ${user.subscriptionTier} → ${activeSubscription.tier}`);
        await user.update({ subscriptionTier: activeSubscription.tier });
        updatedCount++;
      }
    }

    console.log(`✅ Fixed subscription tiers for ${updatedCount} users`);

    // Also check for users who are leaders but have free tier
    const leaderUsers = await User.findAll({
      where: {
        accountType: 'leader',
        subscriptionTier: 'free'
      },
      include: [{
        model: Subscription,
        as: 'subscription',
        required: false
      }]
    });

    console.log(`Found ${leaderUsers.length} leader users with free tier`);

    let leaderUpdatedCount = 0;
    for (const user of leaderUsers) {
      if (user.subscription && user.subscription.status === 'active') {
        console.log(`Updating leader user ${user.email}: free → ${user.subscription.tier}`);
        await user.update({ subscriptionTier: user.subscription.tier });
        leaderUpdatedCount++;
      } else {
        // If no active subscription found, they might have been manually set to leader
        // Default to basic tier for leaders without active subscriptions
        console.log(`Updating leader user ${user.email}: free → basic (no active subscription found)`);
        await user.update({ subscriptionTier: 'basic' });
        leaderUpdatedCount++;
      }
    }

    console.log(`✅ Fixed subscription tiers for ${leaderUpdatedCount} leader users`);

    console.log('🎉 User subscription tier fix completed!');

  } catch (error) {
    console.error('❌ Error fixing user subscription tiers:', error);
  } finally {
    if (sequelize && sequelize.close) {
      await sequelize.close();
    }
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixUserSubscriptionTiers();
}

module.exports = { fixUserSubscriptionTiers };
