const crypto = require('node:crypto');
const { paymongo, publicClientUrl } = require('../config');
const { createHttpError } = require('../utils/httpError');

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

const hasPaymongoConfiguration = () => Boolean(paymongo.secretKey);

const buildAuthorizationHeader = () =>
  `Basic ${Buffer.from(`${paymongo.secretKey}:`).toString('base64')}`;

const createCheckoutSession = async (order) => {
  if (!hasPaymongoConfiguration()) {
    throw createHttpError(503, 'GCash payments are not configured yet.');
  }

  const response = await fetch(`${PAYMONGO_API_URL}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: buildAuthorizationHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        attributes: {
          billing: order.email
            ? {
                email: order.email,
                name: order.customerName,
                phone: order.contactNumber,
              }
            : undefined,
          cancel_url: `${publicClientUrl}/orders/${order.trackingToken}?payment=cancelled`,
          description: `Print-IT order ${order.orderNumber}`,
          line_items: order.items.map((item) => ({
            amount: Math.round(item.unitPrice * 100),
            currency: 'PHP',
            description:
              item.serviceDetails?.specialInstructions || item.serviceDetails?.printType || item.category,
            images: [],
            name: item.productName,
            quantity: item.quantity,
          })),
          metadata: {
            orderId: String(order.id),
            orderNumber: order.orderNumber,
            trackingToken: order.trackingToken,
          },
          payment_method_types: ['gcash'],
          send_email_receipt: Boolean(order.email),
          show_description: true,
          show_line_items: true,
          statement_descriptor: 'PRINTIT',
          success_url: `${publicClientUrl}/orders/${order.trackingToken}?payment=success`,
        },
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const apiMessage =
      payload?.errors?.map((error) => error?.detail).filter(Boolean).join(', ') ||
      payload?.error ||
      'Unable to create a GCash checkout session.';

    throw createHttpError(response.status, apiMessage);
  }

  const session = payload?.data;
  const sessionId = session?.id;
  const checkoutUrl = session?.attributes?.checkout_url;

  if (!sessionId || !checkoutUrl) {
    throw createHttpError(502, 'The payment provider did not return a checkout URL.');
  }

  return {
    provider: 'paymongo',
    reference: sessionId,
    checkoutUrl,
  };
};

const generateTrackingToken = () => crypto.randomBytes(24).toString('hex');

module.exports = {
  createCheckoutSession,
  generateTrackingToken,
  hasPaymongoConfiguration,
};
