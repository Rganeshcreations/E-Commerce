
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const token = localStorage.getItem("marketgrid_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

export const api = {
  // Authentication
  login: (body) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  register: (body) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  users: () => request("/api/users"),

  createUser: (body) =>
    request("/api/users", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  createVendor: (body) =>
    request("/api/vendors", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  // Products
  products: () => request("/api/products"),

  product: (id) => request(`/api/products/${id}`),

  vendorProducts: () => request("/api/products/vendor/1"),

  productsByVendor: (vendorId) =>
    request(`/api/products/vendor/${vendorId}`),

  createProduct: (body) =>
    request("/api/products", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  updateProduct: (id, body) =>
    request(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),

  deleteProduct: (id) =>
    request(`/api/products/${id}`, {
      method: "DELETE"
    }),

  // Vendors
  vendors: () => request("/api/vendors"),

  // Payments
  createPayment: (body) =>
    request("/api/payments", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  payments: () => request("/api/payments"),

  payment: (id) => request(`/api/payments/${id}`),

  paymentByOrder: (orderId) =>
    request(`/api/payments/order/${orderId}`),

  // Orders
  orders: () => request("/api/orders"),

  order: (id) => request(`/api/orders/${id}`),

  createOrder: (body) =>
    request("/api/orders", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  updateOrderStatus: (id, status) =>
    request(
      `/api/orders/${id}/status?status=${encodeURIComponent(status)}`,
      { method: "PATCH" }
    ),

  // Tenant management
  tenants: () => request("/api/tenants"),

  tenantBySlug: (slug) =>
    request(`/api/tenants/slug/${encodeURIComponent(slug)}`),

  // Retained for compatibility with existing code.
  // The new Super Admin page will not expose direct creation.
  createTenant: (body) =>
    request("/api/tenants", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  setTenantActive: (id, active) =>
    request(`/api/tenants/${id}/active?active=${active}`, {
      method: "PATCH"
    }),

  // Tenant applications
  tenantApplications: () =>
    request("/api/tenant-applications"),

  pendingTenantApplications: () =>
    request("/api/tenant-applications/pending"),

  approveTenantApplication: (id) =>
    request(`/api/tenant-applications/${id}/approve`, {
      method: "POST"
    }),

  rejectTenantApplication: (id, reason) =>
    request(`/api/tenant-applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    })
};

