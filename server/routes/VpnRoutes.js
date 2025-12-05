const express = require('express');
const router = express.Router();
const {
    getVpnConfigs,
    getVpnConfig,
    createVpnConfig,
    updateVpnConfig,
    deleteVpnConfig,
    cloneVpnConfig,
    assignVpnTask,
    toggleVpnConfig
} = require('../controllers/VpnController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// VPN config routes
router.get('/', getVpnConfigs);
router.get('/:id', getVpnConfig);
router.post('/', createVpnConfig);
router.put('/:id', updateVpnConfig);
router.delete('/:id', deleteVpnConfig);
router.patch('/:id/toggle', toggleVpnConfig);
router.post('/:id/clone', cloneVpnConfig);
router.post('/:id/assign', assignVpnTask);

module.exports = router;