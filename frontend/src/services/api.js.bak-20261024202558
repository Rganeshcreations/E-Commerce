const BASE = "http://localhost:8080";

async function request(path, options = {}) {

  const token =
    localStorage.getItem("marketgrid_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${BASE}${path}`,
    {
      ...options,
      headers
    }
  );

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

  login: (body) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  products: () =>
    request("/api/products"),

  product: (id) =>
    request(`/api/products/${id}`),

  vendorProducts: () =>
    request("/api/products/vendor/1"),

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

  vendors: () =>
    request("/api/vendors"),

  orders: () =>
    request("/api/orders"),

  order: (id) =>
    request(`/api/orders/${id}`),

  createOrder: (body) =>
    request("/api/orders", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  updateOrderStatus: (id, status) =>
    request(
      `/api/orders/${id}/status?status=${encodeURIComponent(status)}`,
      {
        method: "PATCH"
      }
    )
};

