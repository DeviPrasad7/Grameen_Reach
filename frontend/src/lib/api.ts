import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('gr_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public pages that shouldn't trigger auth redirect
const PUBLIC_PATHS = ['/', '/auth/login', '/auth/register', '/buyer/browse'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith('/buyer/browse/'));
      if (!isPublic) {
        localStorage.removeItem('gr_token');
        localStorage.removeItem('gr_auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  },
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; role: string; phone?: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ── Products ──────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: unknown) => api.post('/products', data),
  update: (id: string, data: unknown) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ── Cart ──────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (productId: string, qty: number) =>
    api.post('/cart/items', { productId, qty }),
  updateItem: (productId: string, qty: number) =>
    api.patch(`/cart/items/${productId}`, { qty }),
  removeItem: (productId: string) => api.delete(`/cart/items/${productId}`),
};

// ── Orders ────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data: unknown) => api.post('/orders', data),
  list: () => api.get('/orders'),
  get: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),
  updateSubOrderStatus: (orderId: string, subOrderId: string, status: string) =>
    api.patch(`/orders/${orderId}/suborders/${subOrderId}/status`, { status }),
};

// ── Payments ──────────────────────────────────────────────────────────────
export const paymentsApi = {
  initiate: (data: { orderId: string; method: string }) =>
    api.post('/payments/initiate', data),
  getStatus: (orderId: string) => api.get(`/payments/${orderId}`),
};

// ── Bids ──────────────────────────────────────────────────────────────────
export const bidsApi = {
  place: (data: unknown) => api.post('/bids', data),
  myBids: () => api.get('/bids/my'),
  farmerBids: () => api.get('/bids/farmer'),
  forProduct: (productId: string) => api.get(`/bids/product/${productId}`),
  respond: (bidId: string, data: unknown) => api.patch(`/bids/${bidId}/respond`, data),
};

// ── Farmer ────────────────────────────────────────────────────────────────
export const farmerApi = {
  getProfile: () => api.get('/farmer/profile'),
  createProfile: (data: unknown) => api.post('/farmer/profile', data),
  updateProfile: (data: unknown) => api.patch('/farmer/profile', data),
  uploadDoc: (data: unknown) => api.post('/farmer/docs', data),
  getMyDocs: () => api.get('/farmer/docs'),
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  pendingFarmers: () => api.get('/admin/farmers/pending'),
  verifyFarmer: (profileId: string, data: unknown) =>
    api.patch(`/admin/farmers/${profileId}/verify`, data),
  allFarmers: () => api.get('/admin/farmers'),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me'),
  update: (data: unknown) => api.patch('/users/me', data),
};

// ── Govt Prices ───────────────────────────────────────────────────────────
export const govtPricesApi = {
  list: (params?: Record<string, unknown>) => api.get('/govt-prices', { params }),
  suggestions: (commodity: string, district: string) =>
    api.get('/govt-prices/suggestions', { params: { commodity, district } }),
  comparison: (commodity: string, district: string) =>
    api.get('/govt-prices/comparison', { params: { commodity, district } }),
  create: (data: unknown) => api.post('/govt-prices', data),
  uploadCsv: (formData: FormData) =>
    api.post('/govt-prices/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── AI ────────────────────────────────────────────────────────────────────
export const aiApi = {
  listingGenerator: (data: unknown) => api.post('/ai/listing-generator', data),
  priceCoach: (data: unknown) => api.post('/ai/price-coach', data),
  counterOffer: (data: unknown) => api.post('/ai/counter-offer', data),
  basketBuilder: (data: unknown) => api.post('/ai/basket-builder', data),
  moderationHelper: (data: unknown) => api.post('/ai/moderation-helper', data),
  auditLogs: (params?: Record<string, unknown>) => api.get('/ai/audit-logs', { params }),
};

// ── Categories ───────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get('/products/categories'),
};

// ── Files ─────────────────────────────────────────────────────────────────
export const filesApi = {
  upload: (formData: FormData) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
