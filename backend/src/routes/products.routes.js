const express = require('express');
const productsController = require('../controllers/products.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/admin/all', requireAdmin, productsController.listAdminProducts);
router.get('/', productsController.listProducts);
router.post('/', requireAdmin, productsController.createProduct);
router.put('/:productId', requireAdmin, productsController.updateProduct);
router.patch('/:productId/active', requireAdmin, productsController.updateProductActive);
router.delete('/:productId', requireAdmin, productsController.deleteProduct);

module.exports = router;
