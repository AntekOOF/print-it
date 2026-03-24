export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value || 0));

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const formatLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const formatPaymentLabel = (value) => {
  const normalized = formatLabel(value);

  return normalized
    .replace(/\bGcash\b/g, 'GCash')
    .replace(/\bPaymongo\b/g, 'PayMongo');
};

export const formatProductAvailability = (product) => {
  if (product.category !== 'Food') {
    return '';
  }

  if (product.stockQuantity === 0) {
    return 'Sold out';
  }

  if (product.stockQuantity !== null && product.stockQuantity !== undefined) {
    return `${product.stockQuantity} left`;
  }

  if (product.dailyLimit !== null && product.dailyLimit !== undefined) {
    return `${product.dailyLimit} daily limit`;
  }

  return '';
};
