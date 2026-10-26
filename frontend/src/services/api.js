
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
      data?.detail ||
      data?.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

export function getUser() {
  const token = localStorage.getItem("marketgrid_token");
  const role = localStorage.getItem("marketgrid_role");
  if (!token || !role) return null;
  return {
    token,
    role,
    id: localStorage.getItem("marketgrid_user_id"),
    userId: localStorage.getItem("marketgrid_user_id"),
    tenantId: localStorage.getItem("marketgrid_tenant"),
    email: localStorage.getItem("marketgrid_email") || ""
  };
}

export function logout() {
  [
    "marketgrid_token", "marketgrid_role", "marketgrid_user_id",
    "marketgrid_customer_id", "marketgrid_tenant", "marketgrid_email",
    "marketgrid_user", "marketgrid_pending_checkout"
  ].forEach(key => localStorage.removeItem(key));
  localStorage.removeItem("marketgrid_cart");
  window.dispatchEvent(new Event("marketgrid_cart_updated"));
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

  // Business domains: public read, SUPER_ADMIN-only create enforced by backend
  domains: () => request("/api/domains"),
  createDomain: (body) => request("/api/domains", {
    method: "POST", body: JSON.stringify(body)
  }),
  publicTenants: () => request("/api/public/tenants"),
  submitTenantApplication: (body) =>
    request("/api/tenant-applications", { method: "POST", body: JSON.stringify(body) }),
  submitVendorApplication: (body) =>
    request("/api/vendor-applications", { method: "POST", body: JSON.stringify(body) }),

  users: () => request("/api/users"),

  createUser: (body) =>
    request("/api/users", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),

  createVendor: (body) =>
    request("/api/vendors", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  // Products
  products: () => request("/api/products"),

  product: (id) => request(`/api/products/${id}`),

  vendorProducts: async () => {
    const vendor = await request("/api/vendors/me");
    return request(`/api/products/vendor/${vendor.id}`);
  },

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
  myVendor: () => request("/api/vendors/me"),

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

