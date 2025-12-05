const express = require('express');
const router = express.Router();
const {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  activateProfile,
  deactivateProfile,
  getProfileLogs,
  getAllLogs
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProfiles)
  .post(createProfile);

router.get('/logs/all', getAllLogs);

router.route('/:id')
  .get(getProfile)
  .put(updateProfile)
  .delete(deleteProfile);

router.put('/:id/activate', activateProfile);

router.get('/:id/logs', getProfileLogs);

router.put('/:id/deactivate', deactivateProfile);

module.exports = router;