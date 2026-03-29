const crypto = require('node:crypto');
const { Blob } = require('node:buffer');
const fs = require('node:fs/promises');
const path = require('node:path');
const { mediaStorage, publicServerUrl, uploadsDir } = require('../config');
const { createHttpError } = require('../utils/httpError');
const { ensureDirectory } = require('../utils/fileSystem');

const sanitizeBaseName = (fileName = 'file') =>
  path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'file';

const buildFileName = (originalName) => `${Date.now()}-${sanitizeBaseName(originalName)}${path.extname(originalName).toLowerCase()}`;

const hasCloudinaryConfiguration = () =>
  Boolean(
    mediaStorage.cloudinary.cloudName &&
      mediaStorage.cloudinary.apiKey &&
      mediaStorage.cloudinary.apiSecret,
  );

const getStorageProvider = () => {
  if (mediaStorage.provider === 'cloudinary') {
    if (!hasCloudinaryConfiguration()) {
      throw createHttpError(500, 'Cloudinary storage is selected but not fully configured.');
    }

    return 'cloudinary';
  }

  if (mediaStorage.provider === 'local') {
    return 'local';
  }

  return hasCloudinaryConfiguration() ? 'cloudinary' : 'local';
};

const uploadToLocal = async (file, folderName) => {
  const fileName = buildFileName(file.originalname);
  const targetDirectory = ensureDirectory(path.join(uploadsDir, folderName));
  const targetPath = path.join(targetDirectory, fileName);

  await fs.writeFile(targetPath, file.buffer);

  const relativePath = `/uploads/${folderName}/${fileName}`;

  return {
    assetPath: relativePath,
    mimeType: file.mimetype,
    originalName: file.originalname,
    relativePath,
    size: file.size,
    storageKey: relativePath,
    storageProvider: 'local',
    url: `${publicServerUrl}${relativePath}`,
  };
};

const uploadToCloudinary = async (file, folderName) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const cloudinaryFolder = [mediaStorage.cloudinary.folder, folderName].filter(Boolean).join('/');
  const publicId = `${Date.now()}-${sanitizeBaseName(file.originalname)}`;
  const signatureBase = `folder=${cloudinaryFolder}&public_id=${publicId}&timestamp=${timestamp}${mediaStorage.cloudinary.apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureBase).digest('hex');

  const body = new FormData();
  body.append('api_key', mediaStorage.cloudinary.apiKey);
  body.append('folder', cloudinaryFolder);
  body.append('public_id', publicId);
  body.append('signature', signature);
  body.append('timestamp', String(timestamp));
  body.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${mediaStorage.cloudinary.cloudName}/auto/upload`,
    {
      method: 'POST',
      body,
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.secure_url) {
    throw createHttpError(
      502,
      payload?.error?.message || 'The file could not be uploaded to cloud storage.',
    );
  }

  return {
    assetPath: payload.secure_url,
    mimeType: payload.resource_type || file.mimetype,
    originalName: file.originalname,
    relativePath: payload.secure_url,
    size: payload.bytes || file.size,
    storageKey: payload.public_id,
    storageProvider: 'cloudinary',
    url: payload.secure_url,
  };
};

const uploadFile = async ({ file, folderName }) => {
  if (!file?.buffer?.length) {
    throw createHttpError(400, 'A file is required.');
  }

  const provider = getStorageProvider();

  return provider === 'cloudinary' ? uploadToCloudinary(file, folderName) : uploadToLocal(file, folderName);
};

module.exports = {
  getStorageProvider,
  hasCloudinaryConfiguration,
  uploadFile,
};
