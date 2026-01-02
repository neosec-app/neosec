const express = require('express');
const router = express.Router();
const {
  startImpersonation,
  endImpersonation,
  getImpersonationSessions
} = require('../controllers/impersonationController');
const { protect, requireLeader } = require('../middleware/auth');

// All routes require admin or leader authentication
router.use(protect);
router.use(requireLeader);

router.post('/start', startImpersonation);
router.post('/end/:sessionId', endImpersonation);
router.get('/sessions', getImpersonationSessions);

module.exports = router;

