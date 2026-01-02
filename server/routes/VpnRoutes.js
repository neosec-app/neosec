const express = require('express');
const router = express.Router();
const {
    getVpnConfigs,
    getVpnConfig,
    createVpnConfig,
    updateVpnConfig,
    deleteVpnConfig,
    cloneVpnConfig,
    toggleVpnConfig,
    downloadVpnConfig
} = require('../controllers/VpnController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// VPN config routes
// More specific routes should come before generic :id routes
router.get('/', getVpnConfigs);
router.post('/', createVpnConfig);
router.get('/:id/download', downloadVpnConfig);
router.patch('/:id/toggle', toggleVpnConfig);
router.post('/:id/toggle', toggleVpnConfig); // Fallback for clients that convert PATCH to POST
router.post('/:id/clone', cloneVpnConfig);
router.get('/:id', getVpnConfig);
router.put('/:id', updateVpnConfig);
router.delete('/:id', deleteVpnConfig);

module.exports = router;