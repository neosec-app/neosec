const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCheckoutSession,
  getBillingHistory,
  getMySubscription,
  upgradeTestUser,
} = require('../controllers/subscriptionController');

router.use(protect);
router.get('/me', getMySubscription);
router.get('/billing', getBillingHistory);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/upgrade-test', upgradeTestUser); // For testing when webhook doesn't fire

module.exports = router;