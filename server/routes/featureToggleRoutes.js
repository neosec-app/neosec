const express = require('express');
const router = express.Router();
const {
  getFeatureToggles,
  checkFeatureAccess,
  setFeatureToggle,
  deleteFeatureToggle
} = require('../controllers/featureToggleController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', admin, getFeatureToggles);
router.get('/check/:featureName', checkFeatureAccess);
router.post('/', admin, setFeatureToggle);
router.delete('/:id', admin, deleteFeatureToggle);

module.exports = router;

