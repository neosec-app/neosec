// Initialize Stripe - use a dummy key if not set to prevent errors
// The actual API calls will fail gracefully if the key is invalid
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_not_set';
const stripe = require('stripe')(stripeKey);

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  WARNING: STRIPE_SECRET_KEY is not set in environment variables!');
    console.warn('   Subscription features will not work until this is configured.');
}

module.exports = stripe;
