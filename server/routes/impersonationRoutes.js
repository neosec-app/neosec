const express = require('express');
const router = express.Router();
const {
  startImpersonation,
  endImpersonation,
  getImpersonationSessions
} = require('../controllers/impersonationController');
const { protect, admin } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(admin);

router.post('/start', startImpersonation);
router.post('/end/:sessionId', endImpersonation);
router.get('/sessions', getImpersonationSessions);

module.exports = router;

