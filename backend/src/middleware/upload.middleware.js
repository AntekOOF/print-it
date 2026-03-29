const multer = require('multer');
const { createHttpError } = require('../utils/httpError');

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const printMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]);
const paymentProofMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const buildUpload = ({ allowedMimeTypes, maxBytes }) =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
    },
    fileFilter: (_request, file, callback) => {
      if (!allowedMimeTypes.has(file.mimetype)) {
        callback(createHttpError(400, 'The selected file type is not supported.'));
        return;
      }

      callback(null, true);
    },
  });

module.exports = {
  productImageUpload: buildUpload({
    allowedMimeTypes: imageMimeTypes,
    maxBytes: 5 * 1024 * 1024,
  }),
  printFileUpload: buildUpload({
    allowedMimeTypes: printMimeTypes,
    maxBytes: 12 * 1024 * 1024,
  }),
  paymentProofUpload: buildUpload({
    allowedMimeTypes: paymentProofMimeTypes,
    maxBytes: 8 * 1024 * 1024,
  }),
};
