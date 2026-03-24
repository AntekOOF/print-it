const crypto = require('node:crypto');

const compareSignatures = (left, right) => {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

module.exports = {
  compareSignatures,
};
