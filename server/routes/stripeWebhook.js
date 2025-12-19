const express = require('express');
const stripe = require('../config/stripe');
const Subscription = require('../models/Subscription');

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

      let sub = await Subscription.findOne({ where: { userId } });

      if (!sub) {
        await Subscription.create({
          userId,
          tier,
          isActive: true,
        });
      } else {
        await sub.update({ tier, isActive: true });
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;
