const { createHttpError } = require('./httpError');

const ALLOWED_CATEGORIES = new Set(['Food', 'Services']);
const ALLOWED_FULFILLMENT_METHODS = new Set(['pickup', 'delivery']);
const ALLOWED_PAYMENT_METHODS = new Set(['cash_on_pickup', 'gcash', 'manual_gcash']);
const ALLOWED_ORDER_STATUSES = new Set(['pending', 'processing', 'ready', 'completed']);
const ALLOWED_PAYMENT_STATUSES = new Set(['pending', 'awaiting_payment', 'paid', 'failed', 'expired', 'refunded']);

const trimString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeCategory = (value) => {
  const normalized = trimString(value).toLowerCase();

  if (normalized === 'food') {
    return 'Food';
  }

  if (normalized === 'services' || normalized === 'service') {
    return 'Services';
  }

  return trimString(value);
};

const parseOptionalInteger = (value) => {
  if (value === null || value === undefined || trimString(String(value)) === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : NaN;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }

    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  return Boolean(value);
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseCommaList = (value) =>
  Array.from(
    new Set(
      trimString(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

const normalizeServiceConfig = (rawConfig) => {
  const config = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};

  return {
    printTypes: Array.isArray(config.printTypes) ? config.printTypes.map(trimString).filter(Boolean) : parseCommaList(config.printTypes || ''),
    paperSizes: Array.isArray(config.paperSizes) ? config.paperSizes.map(trimString).filter(Boolean) : parseCommaList(config.paperSizes || ''),
    colorModes: Array.isArray(config.colorModes) ? config.colorModes.map(trimString).filter(Boolean) : parseCommaList(config.colorModes || ''),
    printSides: Array.isArray(config.printSides) ? config.printSides.map(trimString).filter(Boolean) : parseCommaList(config.printSides || ''),
    finishes: Array.isArray(config.finishes) ? config.finishes.map(trimString).filter(Boolean) : parseCommaList(config.finishes || ''),
  };
};

const validateProductPayload = (payload) => {
  const normalized = {
    name: trimString(payload?.name),
    description: trimString(payload?.description),
    image: trimString(payload?.image),
    category: normalizeCategory(payload?.category),
    price: toFiniteNumber(payload?.price),
    isActive: payload?.isActive === undefined ? true : parseBoolean(payload?.isActive),
    stockQuantity: parseOptionalInteger(payload?.stockQuantity),
    dailyLimit: parseOptionalInteger(payload?.dailyLimit),
    serviceConfig: normalizeServiceConfig(payload?.serviceConfig),
  };

  if (normalized.name.length < 2 || normalized.name.length > 120) {
    throw createHttpError(400, 'Product name must be between 2 and 120 characters.');
  }

  if (!Number.isFinite(normalized.price) || normalized.price <= 0) {
    throw createHttpError(400, 'Product price must be a positive number.');
  }

  if (normalized.description.length < 10 || normalized.description.length > 600) {
    throw createHttpError(400, 'Product description must be between 10 and 600 characters.');
  }

  if (!normalized.image || normalized.image.length > 500) {
    throw createHttpError(400, 'Product image is required and must be under 500 characters.');
  }

  if (!ALLOWED_CATEGORIES.has(normalized.category)) {
    throw createHttpError(400, 'Product category must be either Food or Services.');
  }

  if (normalized.stockQuantity !== null && (!Number.isInteger(normalized.stockQuantity) || normalized.stockQuantity < 0)) {
    throw createHttpError(400, 'Stock quantity must be a whole number greater than or equal to zero.');
  }

  if (normalized.dailyLimit !== null && (!Number.isInteger(normalized.dailyLimit) || normalized.dailyLimit < 0)) {
    throw createHttpError(400, 'Daily limit must be a whole number greater than or equal to zero.');
  }

  if (normalized.category === 'Services') {
    if (!normalized.serviceConfig.printTypes.length) {
      normalized.serviceConfig.printTypes = ['Document', 'Photo', 'Reviewers', 'Custom Layout'];
    }

    if (!normalized.serviceConfig.paperSizes.length) {
      normalized.serviceConfig.paperSizes = ['Short', 'A4', 'Legal'];
    }

    if (!normalized.serviceConfig.colorModes.length) {
      normalized.serviceConfig.colorModes = ['Black and White', 'Colored'];
    }

    if (!normalized.serviceConfig.printSides.length) {
      normalized.serviceConfig.printSides = ['Single-sided', 'Double-sided'];
    }

    if (!normalized.serviceConfig.finishes.length) {
      normalized.serviceConfig.finishes = ['Plain', 'Glossy', 'Matte', 'Laminated'];
    }
  } else {
    normalized.serviceConfig = {};
  }

  return {
    ...normalized,
    price: Number(normalized.price.toFixed(2)),
  };
};

const validateProductId = (value) => {
  const id = Number.parseInt(value, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, 'Product id must be a positive integer.');
  }

  return id;
};

const normalizeServiceDetails = (rawDetails) => {
  const details = {
    printType: trimString(rawDetails?.printType),
    paperSize: trimString(rawDetails?.paperSize),
    colorMode: trimString(rawDetails?.colorMode),
    printSide: trimString(rawDetails?.printSide),
    finish: trimString(rawDetails?.finish),
    specialInstructions: trimString(rawDetails?.specialInstructions),
    fileName: trimString(rawDetails?.fileName || rawDetails?.originalName),
    fileUrl: trimString(rawDetails?.fileUrl || rawDetails?.url),
  };

  return Object.fromEntries(Object.entries(details).filter(([, value]) => value));
};

const validateOrderPayload = (payload) => {
  const customerName = trimString(payload?.customerName);
  const contactNumber = trimString(payload?.contactNumber);
  const email = trimString(payload?.email);
  const notes = trimString(payload?.notes);
  const fulfillmentMethod = trimString(payload?.fulfillmentMethod || 'pickup').toLowerCase();
  const paymentMethod = trimString(payload?.paymentMethod || 'cash_on_pickup').toLowerCase();
  const paymentReference = trimString(payload?.paymentReference);

  if (customerName.length < 2 || customerName.length > 120) {
    throw createHttpError(400, 'Customer name must be between 2 and 120 characters.');
  }

  if (contactNumber.length < 7 || contactNumber.length > 25) {
    throw createHttpError(400, 'Contact number must be between 7 and 25 characters.');
  }

  if (email && !isValidEmail(email)) {
    throw createHttpError(400, 'Email address is invalid.');
  }

  if (!ALLOWED_FULFILLMENT_METHODS.has(fulfillmentMethod)) {
    throw createHttpError(400, 'Fulfillment method must be pickup or delivery.');
  }

  if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
    throw createHttpError(400, 'Payment method must be cash_on_pickup, gcash, or manual_gcash.');
  }

  if (notes.length > 600) {
    throw createHttpError(400, 'Order notes must be 600 characters or fewer.');
  }

  if (paymentReference.length > 160) {
    throw createHttpError(400, 'Payment reference must be 160 characters or fewer.');
  }

  if (!Array.isArray(payload?.items) || payload.items.length === 0) {
    throw createHttpError(400, 'At least one item is required to place an order.');
  }

  const items = payload.items.map((item, index) => {
    const productId = Number.parseInt(item?.productId, 10);
    const quantity = Number.parseInt(item?.quantity, 10);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw createHttpError(400, `Item ${index + 1} has an invalid product id.`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 999) {
      throw createHttpError(400, `Item ${index + 1} must have a quantity between 1 and 999.`);
    }

    return {
      productId,
      quantity,
      serviceDetails: normalizeServiceDetails(item?.serviceDetails),
    };
  });

  return {
    customerName,
    contactNumber,
    email,
    notes,
    fulfillmentMethod,
    paymentMethod,
    paymentReference,
    items,
  };
};

const validateOrderId = (value) => {
  const id = Number.parseInt(value, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, 'Order id must be a positive integer.');
  }

  return id;
};

const validateTrackingPayload = (payload) => {
  const orderNumber = trimString(payload?.orderNumber);
  const contactNumber = trimString(payload?.contactNumber);

  if (!orderNumber) {
    throw createHttpError(400, 'Order number is required.');
  }

  if (!contactNumber) {
    throw createHttpError(400, 'Contact number is required.');
  }

  return {
    contactNumber,
    orderNumber,
  };
};

const validateOrderStatusPayload = (payload) => {
  const status = trimString(payload?.status).toLowerCase();

  if (!ALLOWED_ORDER_STATUSES.has(status)) {
    throw createHttpError(400, 'Order status is invalid.');
  }

  return status;
};

const validatePaymentStatusPayload = (payload) => {
  const paymentStatus = trimString(payload?.paymentStatus).toLowerCase();

  if (!ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
    throw createHttpError(400, 'Payment status is invalid.');
  }

  return paymentStatus;
};

const validateFilters = (query) => {
  const status = trimString(query?.status).toLowerCase();
  const paymentStatus = trimString(query?.paymentStatus).toLowerCase();
  const search = trimString(query?.search);
  const dateFrom = trimString(query?.dateFrom);
  const dateTo = trimString(query?.dateTo);

  if (status && !ALLOWED_ORDER_STATUSES.has(status)) {
    throw createHttpError(400, 'Status filter is invalid.');
  }

  if (paymentStatus && !ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
    throw createHttpError(400, 'Payment status filter is invalid.');
  }

  return {
    dateFrom,
    dateTo,
    paymentStatus,
    search,
    status,
  };
};

const validateLoginPayload = (payload) => {
  const email = trimString(payload?.email).toLowerCase();
  const password = trimString(payload?.password);

  if (!email || !password) {
    throw createHttpError(400, 'Email and password are required.');
  }

  return {
    email,
    password,
  };
};

const validateTrackingToken = (value) => {
  const trackingToken = trimString(value);

  if (trackingToken.length < 16) {
    throw createHttpError(400, 'Tracking token is invalid.');
  }

  return trackingToken;
};

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_ORDER_STATUSES,
  ALLOWED_PAYMENT_METHODS,
  ALLOWED_PAYMENT_STATUSES,
  normalizeCategory,
  validateFilters,
  validateLoginPayload,
  validateOrderId,
  validateOrderPayload,
  validateOrderStatusPayload,
  validatePaymentStatusPayload,
  validateProductId,
  validateProductPayload,
  validateTrackingPayload,
  validateTrackingToken,
};
