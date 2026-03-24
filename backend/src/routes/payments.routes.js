const express = require('express');
const paymentsController = require('../controllers/payments.controller');

const router = express.Router();

router.get('/config', paymentsController.getPaymentConfig);
router.post('/orders/:trackingToken/checkout', paymentsController.createCheckoutSession);

module.exports = router;
