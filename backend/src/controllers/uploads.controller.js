const { uploadFile } = require('../services/media.service');

const uploadProductImage = async (request, response, next) => {
  try {
    const filePayload = await uploadFile({
      file: request.file,
      folderName: 'products',
    });

    response.status(201).json({
      data: filePayload,
      message: 'Product image uploaded successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const uploadPrintFile = async (request, response, next) => {
  try {
    const filePayload = await uploadFile({
      file: request.file,
      folderName: 'print-files',
    });

    response.status(201).json({
      data: filePayload,
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
