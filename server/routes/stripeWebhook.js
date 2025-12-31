const express = require('express');
const stripe = require('../config/stripe');
const Subscription = require('../models/Subscription');
const BillingHistory = require('../models/BillingHistory');
const User = require('../models/User');

const router = express.Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const userId = session.metadata.userId;
      const tier = session.metadata.tier;

      // Update or create subscription
      let sub = await Subscription.findOne({ where: { userId } });

      if (!sub) {
        await Subscription.create({
          userId,
          tier,
          status: 'active',
        });
      } else {
        await sub.update({ tier, status: 'active' });
      }

      // Update user account type and subscription tier when they pay
      await User.update(
        {
          accountType: 'leader',
          subscriptionTier: tier
        },
        { where: { id: userId } }
      );

      console.log(`User ${userId} upgraded to leader account type after successful payment`);
    } else if (event.type === 'invoice.payment_succeeded') {
      // Handle successful payment for subscription
      const invoice = event.data.object;

      // Only process subscription invoices (not one-time payments)
      if (invoice.subscription && invoice.customer_email) {
        try {
          // Find user by email
          const user = await User.findOne({ where: { email: invoice.customer_email } });

          if (user) {
            // Find subscription by user ID
            const subscription = await Subscription.findOne({ where: { userId: user.id } });

            // Create billing history record
            await BillingHistory.create({
              userId: user.id,
              subscriptionId: subscription ? subscription.id : null,
              plan: invoice.lines.data[0]?.description || 'Subscription',
              amount: (invoice.amount_paid / 100).toString(), // Convert from cents
              status: 'paid',
              paidAt: new Date(invoice.status_transitions.paid_at * 1000),
              stripeInvoiceId: invoice.id,
              stripePaymentIntentId: invoice.payment_intent
            });

            console.log(`Billing history created for user ${user.id}, amount: $${invoice.amount_paid / 100}`);
          }
        } catch (error) {
          console.error('Error creating billing history:', error);
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      // Handle subscription cancellation
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        // Note: According to business logic, once someone pays they remain a leader
        // So we don't revert accountType back to regular user
        console.log(`Subscription canceled for user ${userId}, but keeping leader status`);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;
