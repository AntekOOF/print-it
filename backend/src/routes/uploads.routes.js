const express = require('express');
const uploadsController = require('../controllers/uploads.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { printFileUpload, productImageUpload } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/product-image', requireAdmin, productImageUpload.single('file'), uploadsController.uploadProductImage);
router.post('/print-file', printFileUpload.single('file'), uploadsController.uploadPrintFile);

module.exports = router;
