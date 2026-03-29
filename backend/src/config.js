require('dotenv').config();
const path = require('node:path');

const parseBoolean = (value = '') => ['1', 'true', 'yes'].includes(String(value).toLowerCase());
const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
};
const parseList = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const port = parseInteger(process.env.PORT, 5000);
const publicClientUrls = Array.from(
  new Set([
    process.env.PUBLIC_CLIENT_URL || 'http://localhost:5173',
    ...parseList(process.env.PUBLIC_CLIENT_URLS),
  ]),
);

const buildPgConfig = () => {
  if (process.env.DATABASE_URL) {
    const config = {
      connectionString: process.env.DATABASE_URL,
    };

    if (parseBoolean(process.env.DB_SSL)) {
      config.ssl = { rejectUnauthorized: false };
    }

    return config;
  }

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'print_it',
  };

  if (parseBoolean(process.env.DB_SSL)) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
};

module.exports = {
  port,
  pgConfig: buildPgConfig(),
  rootDir: path.resolve(__dirname, '..'),
  publicServerUrl: process.env.PUBLIC_SERVER_URL || `http://localhost:${port}`,
  publicClientUrl: publicClientUrls[0],
  publicClientUrls,
  jwtSecret: process.env.JWT_SECRET || 'change-this-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@print-it.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'change-this-admin-password',
  manualGcashNumber: process.env.MANUAL_GCASH_NUMBER || '',
  uploadsDir: path.resolve(__dirname, '..', 'uploads'),
  mediaStorage: {
    provider: process.env.MEDIA_STORAGE_PROVIDER || 'auto',
    cloudinary: {
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      folder: process.env.CLOUDINARY_FOLDER || 'print-it',
    },
  },
  paymongo: {
    secretKey: process.env.PAYMONGO_SECRET_KEY || '',
    webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInteger(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Print-IT <no-reply@print-it.local>',
    secure: parseBoolean(process.env.SMTP_SECURE),
  },
};
