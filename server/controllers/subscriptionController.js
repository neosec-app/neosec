const stripe = require('../config/stripe');
const Subscription = require('../models/Subscription');
const BillingHistory = require('../models/BillingHistory');

// Define Stripe Price IDs for each tier
// Replace these with your actual Stripe Price IDs from your Stripe Dashboard
const PRICE_MAP = {
  basic: process.env.STRIPE_PRICE_BASIC || 'price_basic_placeholder',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',
};

const getMySubscription = async (req, res) => {
  try {
    console.log('=== GET MY SUBSCRIPTION ===');
    console.log('req.user:', req.user);
    console.log('req.user.id:', req.user?.id);

    if (!req.user || !req.user.id) {
      console.log('No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found in request',
      });
    }

    console.log('Looking for subscription for userId:', req.user.id);

    const subscription = await Subscription.findOne({
      where: { userId: req.user.id },
    });

    console.log('Found subscription:', subscription);
    console.log('Subscription tier:', subscription?.tier);
    console.log('Subscription status:', subscription?.status);

    const responseData = {
      success: true,
      subscription: subscription || { tier: 'free', status: 'active' },
    };

    console.log('Sending response:', JSON.stringify(responseData, null, 2));

    res.json(responseData);
  } catch (error) {
    console.error('Get subscription error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message,
    });
  }
};

const getBillingHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const history = await BillingHistory.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']], 
    });

    res.json({
      success: true,
      history: history || [],
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history',
      error: error.message,
    });
  }
};


const createCheckoutSession = async (req, res) => {
  try {
    console.log('=== SUBSCRIPTION ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user ? { id: req.user.id, email: req.user.email } : 'No user');

    const { tier } = req.body;

    if (!req.user || !req.user.id) {
      console.log('ERROR: No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!tier || !PRICE_MAP[tier]) {
      console.log('ERROR: Invalid tier:', tier, 'Available:', Object.keys(PRICE_MAP));
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription tier. Must be: basic, pro, or enterprise',
      });
    }

    console.log('Creating checkout session for:', {
      userId: req.user.id,
      email: req.user.email,
      tier,
      priceId: PRICE_MAP[tier],
    });

    console.log('Calling Stripe API...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      line_items: [
        {
          price: PRICE_MAP[tier],
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription?success=true`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription?canceled=true`,
      metadata: {
        userId: req.user.id,
        tier,
      },
    });

    console.log('Stripe session created successfully:', { id: session.id, url: session.url });

    const response = {
      success: true,
      url: session.url,
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('=== SUBSCRIPTION ERROR ===');
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create checkout session',
      error: error.message,
      code: error.code,
      type: error.type,
    });
  }
};

// Log Stripe configuration (only in development or if keys are missing)
if (process.env.NODE_ENV !== 'production' || !process.env.STRIPE_SECRET_KEY) {
  console.log('Stripe configuration:', {
    keyLoaded: !!process.env.STRIPE_SECRET_KEY,
    webhookSecretLoaded: !!process.env.STRIPE_WEBHOOK_SECRET,
    priceBasic: PRICE_MAP.basic,
    pricePro: PRICE_MAP.pro,
    priceEnterprise: PRICE_MAP.enterprise,
  });
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY is not set. Subscription features will not work.');
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET is not set. Webhook verification will fail.');
  }
  if (PRICE_MAP.basic.includes('placeholder') || PRICE_MAP.pro.includes('placeholder') || PRICE_MAP.enterprise.includes('placeholder')) {
    console.warn('⚠️  Stripe Price IDs are using placeholders. Set STRIPE_PRICE_BASIC, STRIPE_PRICE_PRO, and STRIPE_PRICE_ENTERPRISE environment variables.');
  }
}

// Test endpoint for manual user upgrade (for development/testing when webhook doesn't fire)
const upgradeTestUser = async (req, res) => {
  try {
    console.log('Manual upgrade test called for user:', req.user.id);

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Update user to leader
    const User = require('../models/User');
    await User.update(
      { accountType: 'leader' },
      { where: { id: req.user.id } }
    );

    // Create or update subscription
    let subscription = await Subscription.findOne({ where: { userId: req.user.id } });
    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.user.id,
        tier: 'basic', // Default to basic for manual upgrade
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      });
    } else {
      // If subscription exists, ensure it's active
      await subscription.update({ status: 'active' });
    }

    console.log('User manually upgraded to leader:', req.user.id);

    res.json({
      success: true,
      message: 'User upgraded to leader',
    });
  } catch (error) {
    console.error('Manual upgrade error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade user',
      error: error.message,
    });
  }
};

module.exports = {
  createCheckoutSession,
  getBillingHistory,
  getMySubscription,
  upgradeTestUser,
};