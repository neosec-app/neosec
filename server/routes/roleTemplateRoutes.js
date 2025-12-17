const express = require('express');
const router = express.Router();
const {
  getRoleTemplates,
  getRoleTemplate,
  createRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate
} = require('../controllers/roleTemplateController');
const { protect, admin } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(admin);

router.get('/', getRoleTemplates);
router.get('/:id', getRoleTemplate);
router.post('/', createRoleTemplate);
router.put('/:id', updateRoleTemplate);
router.delete('/:id', deleteRoleTemplate);

module.exports = router;

