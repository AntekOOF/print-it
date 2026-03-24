const express = require('express');
const ordersController = require('../controllers/orders.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', ordersController.createOrder);
router.post('/track', ordersController.trackOrder);
router.get('/public/:trackingToken', ordersController.getPublicOrder);
router.get('/admin/summary', requireAdmin, ordersController.getOrderSummary);
router.get('/', requireAdmin, ordersController.listOrders);
router.get('/:orderId', requireAdmin, ordersController.getOrderById);
router.patch('/:orderId/status', requireAdmin, ordersController.updateOrderStatus);
router.patch('/:orderId/payment-status', requireAdmin, ordersController.updatePaymentStatus);

module.exports = router;
