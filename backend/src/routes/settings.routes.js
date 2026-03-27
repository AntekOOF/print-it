const express = require('express');
const settingsController = require('../controllers/settings.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', settingsController.getSettings);
router.put('/', requireAdmin, settingsController.updateSettings);

module.exports = router;
