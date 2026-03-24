const { publicServerUrl } = require('../config');
const { createHttpError } = require('../utils/httpError');

const buildFilePayload = (request, folderName) => {
  if (!request.file) {
    throw createHttpError(400, 'A file is required.');
  }

  const relativePath = `/uploads/${folderName}/${request.file.filename}`;

  return {
    mimeType: request.file.mimetype,
    originalName: request.file.originalname,
    relativePath,
    size: request.file.size,
    url: `${publicServerUrl}${relativePath}`,
  };
};

const uploadProductImage = async (request, response, next) => {
  try {
    response.status(201).json({
      data: buildFilePayload(request, 'products'),
      message: 'Product image uploaded successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const uploadPrintFile = async (request, response, next) => {
  try {
    response.status(201).json({
      data: buildFilePayload(request, 'print-files'),
      message: 'Print file uploaded successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadPrintFile,
  uploadProductImage,
};
