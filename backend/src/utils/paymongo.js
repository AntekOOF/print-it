const crypto = require('node:crypto');
const { paymongo } = require('../config');
const { compareSignatures } = require('./security');

const parseSignatureHeader = (headerValue = '') =>
  headerValue.split(',').reduce((parts, segment) => {
    const [key, value] = segment.split('=');

    if (key && value) {
      parts[key.trim()] = value.trim();
    }

    return parts;
  }, {});

const verifyPaymongoSignature = (rawBody, signatureHeader) => {
  if (!paymongo.webhookSecret) {
    return false;
  }

  const parsed = parseSignatureHeader(signatureHeader);
  const signature = parsed.li || parsed.te;

  if (!parsed.t || !signature) {
    return false;
  }

  const signedPayload = `${parsed.t}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', paymongo.webhookSecret)
    .update(signedPayload)
    .digest('hex');

  return compareSignatures(expectedSignature, signature);
};

module.exports = {
  verifyPaymongoSignature,
};
