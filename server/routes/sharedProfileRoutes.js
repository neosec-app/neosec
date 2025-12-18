const express = require('express');
const router = express.Router();
const {
  createShareLink,
  getSharedProfile,
  importSharedProfile,
  getMyShareLinks,
  revokeShareLink,
  getShareLinkLogs,
  deleteShareLink,
  debugSharedProfile
} = require('../controllers/sharedProfileController');
const { protect } = require('../middleware/auth');

// Protected routes FIRST (more specific routes)
router.post('/', protect, createShareLink);
router.get('/my/shares', protect, getMyShareLinks);
router.post('/:token/import', protect, importSharedProfile);
router.put('/:id/revoke', protect, revokeShareLink);
router.get('/:id/logs', protect, getShareLinkLogs);
router.delete('/:id', protect, deleteShareLink);

// Debug route (add this before the public route)
router.get('/debug/:token', debugSharedProfile);

// Public route LAST (most generic route)
router.get('/:token', getSharedProfile);

module.exports = router;