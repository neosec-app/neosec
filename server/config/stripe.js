const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('WARNING: STRIPE_SECRET_KEY is not set in environment variables!');
}

module.exports = stripe;
