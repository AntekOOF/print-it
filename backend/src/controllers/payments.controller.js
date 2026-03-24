const { manualGcashNumber } = require('../config');
const ordersService = require('../services/orders.service');
const paymentsService = require('../services/payments.service');
const { verifyPaymongoSignature } = require('../utils/paymongo');
const { createHttpError } = require('../utils/httpError');

const getPaymentConfig = async (_request, response) => {
  const gcashEnabled = paymentsService.hasPaymongoConfiguration();
  response.json({
    data: {
      gcashEnabled,
      provider: gcashEnabled ? 'paymongo' : null,
      manualGcashEnabled: Boolean(manualGcashNumber),
      manualGcashNumber: manualGcashNumber || null,
    },
  });
};

const createCheckoutSession = async (request, response, next) => {
  try {
    const order = await ordersService.createOrRefreshCheckoutSession(request.params.trackingToken);
    response.json({
      data: order,
      message: 'GCash checkout session created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const handlePaymongoWebhook = async (request, response, next) => {
  try {
    const rawBody = request.body.toString('utf8');
    const signatureHeader = request.headers['paymongo-signature'];

    if (!verifyPaymongoSignature(rawBody, signatureHeader)) {
      throw createHttpError(401, 'Webhook signature verification failed.');
    }

    const payload = JSON.parse(rawBody);
    await ordersService.handlePaymentWebhookEvent(payload);
    response.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckoutSession,
  getPaymentConfig,
  handlePaymongoWebhook,
};
