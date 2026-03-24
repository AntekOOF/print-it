const path = require('node:path');
const multer = require('multer');
const { uploadsDir } = require('../config');
const { createHttpError } = require('../utils/httpError');
const { ensureDirectory } = require('../utils/fileSystem');

const buildStorage = (folderName) =>
  multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, ensureDirectory(path.join(uploadsDir, folderName)));
    },
    filename: (_request, file, callback) => {
      const safeBaseName = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);

      callback(null, `${Date.now()}-${safeBaseName}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

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

const buildUpload = ({ folderName, allowedMimeTypes, maxBytes }) =>
  multer({
    storage: buildStorage(folderName),
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
    folderName: 'products',
    allowedMimeTypes: imageMimeTypes,
    maxBytes: 5 * 1024 * 1024,
  }),
  printFileUpload: buildUpload({
    folderName: 'print-files',
    allowedMimeTypes: printMimeTypes,
    maxBytes: 12 * 1024 * 1024,
  }),
};
