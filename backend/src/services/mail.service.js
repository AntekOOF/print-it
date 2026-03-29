const nodemailer = require('nodemailer');
const { manualGcashNumber, publicClientUrl, smtp } = require('../config');

let transport;

const getTransport = () => {
  if (transport !== undefined) {
    return transport;
  }

  if (!smtp.host || !smtp.user || !smtp.pass) {
    transport = null;
    return transport;
  }

  transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  return transport;
};

const sendMail = async (message) => {
  const mailTransport = getTransport();

  if (!mailTransport) {
    console.info('SMTP credentials are not configured. Skipping email notification.');
    return false;
  }

  await mailTransport.sendMail({
    from: smtp.from,
    ...message,
  });

  return true;
};

const buildItemsHtml = (items) =>
  items
    .map(
      (item) =>
        `<li>${item.quantity}x ${item.productName} - PHP ${Number(item.lineTotal).toFixed(2)}</li>`,
    )
    .join('');

const sendOrderCreatedEmail = async (order) => {
  if (!order.email) {
    return false;
  }

  const orderLink = `${publicClientUrl}/orders/${order.trackingToken}`;

  return sendMail({
    to: order.email,
    subject: `Print-IT Order Received: ${order.orderNumber}`,
    html: `
      <h2>Order received</h2>
      <p>Hi ${order.customerName}, your order has been received.</p>
      <p><strong>Order number:</strong> ${order.orderNumber}</p>
      <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
      <p><strong>Payment status:</strong> ${order.paymentStatus}</p>
      <p><strong>Total:</strong> PHP ${order.total.toFixed(2)}</p>
      <p><strong>Track order:</strong> <a href="${orderLink}">${orderLink}</a></p>
      ${order.paymentUrl ? `<p><strong>Pay with GCash:</strong> <a href="${order.paymentUrl}">${order.paymentUrl}</a></p>` : ''}
      ${
        order.paymentMethod === 'manual_gcash' && manualGcashNumber
          ? `<p><strong>Manual GCash number:</strong> ${manualGcashNumber}</p><p>Send the payment manually, upload your payment proof from the order page, then wait for admin verification.</p>`
          : ''
      }
      <ul>${buildItemsHtml(order.items)}</ul>
    `,
  });
};

const sendOrderStatusEmail = async (order, contextLabel) => {
  if (!order.email) {
    return false;
  }

  const orderLink = `${publicClientUrl}/orders/${order.trackingToken}`;

  return sendMail({
    to: order.email,
    subject: `Print-IT Order Update: ${order.orderNumber}`,
    html: `
      <h2>Order update</h2>
      <p>Hi ${order.customerName}, your order has a new update.</p>
      <p><strong>Update:</strong> ${contextLabel}</p>
      <p><strong>Order status:</strong> ${order.status}</p>
      <p><strong>Payment status:</strong> ${order.paymentStatus}</p>
      <p><strong>Total:</strong> PHP ${order.total.toFixed(2)}</p>
      <p><strong>Track order:</strong> <a href="${orderLink}">${orderLink}</a></p>
    `,
  });
};

module.exports = {
  sendOrderCreatedEmail,
  sendOrderStatusEmail,
};
