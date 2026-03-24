import { getApiOrigin } from './api.js';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export const resolveMediaUrl = (value) => {
  if (!value) {
    return '';
  }

  if (ABSOLUTE_URL_PATTERN.test(value)) {
    return value;
  }

  if (value.startsWith('/uploads/')) {
    return `${getApiOrigin()}${value}`;
  }

  return value;
};
