const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const isLocalHostname =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (isLocalHostname || import.meta.env.DEV ? DEFAULT_LOCAL_API_BASE_URL : '');
const API_ORIGIN = API_BASE_URL ? API_BASE_URL.replace(/\/api\/?$/, '') : '';

const buildHeaders = ({ headers = {}, token, isFormData = false }) => {
  const nextHeaders = { ...headers };

  if (!isFormData) {
    nextHeaders['Content-Type'] = nextHeaders['Content-Type'] || 'application/json';
  }

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  return nextHeaders;
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

async function request(endpoint, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('The frontend API is not configured for this environment yet.');
  }

  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders({
      headers: options.headers,
      token: options.token,
      isFormData,
    }),
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed.');
  }

  return payload?.data ?? payload;
}

export const getApiOrigin = () => API_ORIGIN;

export const getProducts = (category) => request(`/products${buildQueryString({ category })}`);
export const getAdminProducts = (token, category) =>
  request(`/products/admin/all${buildQueryString({ category })}`, { token });
export const createProduct = (token, product) =>
  request('/products', {
    method: 'POST',
    token,
    body: JSON.stringify(product),
  });
export const updateProduct = (token, productId, product) =>
  request(`/products/${productId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(product),
  });
export const updateProductActive = (token, productId, isActive) =>
  request(`/products/${productId}/active`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ isActive }),
  });
export const deleteProduct = (token, productId) =>
  request(`/products/${productId}`, {
    method: 'DELETE',
    token,
  });

export const uploadProductImage = async (token, file) => {
  const body = new FormData();
  body.append('file', file);

  return request('/uploads/product-image', {
    method: 'POST',
    token,
    body,
  });
};

export const uploadPrintFile = async (file) => {
  const body = new FormData();
  body.append('file', file);

  return request('/uploads/print-file', {
    method: 'POST',
    body,
  });
};

export const uploadOrderPaymentProof = async (token, orderId, file, paymentReference = '') => {
  const body = new FormData();
  body.append('file', file);

  if (paymentReference) {
    body.append('paymentReference', paymentReference);
  }

  return request(`/orders/${orderId}/payment-proof`, {
    method: 'POST',
    token,
    body,
  });
};

export const registerUser = (payload) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const loginUser = (credentials) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
export const loginAdmin = loginUser;
export const getCurrentUser = (token) => request('/auth/me', { token });

export const getOrders = (token, filters = {}) =>
  request(`/orders${buildQueryString(filters)}`, {
    token,
  });
export const getOrderSummary = (token) =>
  request('/orders/admin/summary', {
    token,
  });
export const getOrderById = (token, orderId) =>
  request(`/orders/${orderId}`, {
    token,
  });
export const getMyOrders = (token) =>
  request('/orders/mine', {
    token,
  });
export const getPublicOrder = (trackingToken) => request(`/orders/public/${trackingToken}`);
export const trackOrder = (payload) =>
  request('/orders/track', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const createOrder = (token, order) =>
  request('/orders', {
    method: 'POST',
    token,
    body: JSON.stringify(order),
  });
export const updateOrderStatus = (token, orderId, status) =>
  request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
export const updatePaymentStatus = (token, orderId, paymentStatus) =>
  request(`/orders/${orderId}/payment-status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ paymentStatus }),
  });

export const getPaymentConfig = () => request('/payments/config');
export const createGcashCheckout = (trackingToken) =>
  request(`/payments/orders/${trackingToken}/checkout`, {
    method: 'POST',
  });
export const getSiteSettings = () => request('/settings');
export const updateSiteSettings = (token, payload) =>
  request('/settings', {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
