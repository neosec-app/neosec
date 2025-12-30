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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found in request',
      });
    }

    const subscription = await Subscription.findOne({
      where: { userId: req.user.id },
    });

    res.json({
      success: true,
      subscription: subscription || { tier: 'free', status: 'active' },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
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
    const { tier } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!tier || !PRICE_MAP[tier]) {
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

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message,
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

module.exports = {
  createCheckoutSession,
  getBillingHistory,
  getMySubscription,
};