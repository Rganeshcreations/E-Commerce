import React, { useEffect, useMemo, useState } from "react";
import {
  Package, Plus, Search, Edit3, Trash2, RefreshCw,
  X, Boxes, IndianRupee, CheckCircle2
} from "lucide-react";
import { api } from "../services/api";

const imageMap = {
  "gaming laptop": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
  "iphone": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=80",
  "iphoneflip": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  "mechanical keyboard": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
  "wireless mouse": "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80",
  "smart watch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  "wireless headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  "digital camera": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  "bluetooth speaker": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80"
};

const fallbackImage =
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=900&q=80";

function getImage(name) {
  return imageMap[String(name || "").toLowerCase()] || fallbackImage;
}

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    productName: "",
    description: "",
    price: "",
    stockQuantity: ""
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.products();
      setProducts(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return products;

    return products.filter(p =>
      `${p.productName || ""} ${p.description || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  const totalStock = products.reduce(
    (sum, p) => sum + Number(p.stockQuantity || 0),
    0
  );

  const lowStock = products.filter(
    p => Number(p.stockQuantity || 0) <= 5
  ).length;

  function openAdd() {
    setEditing(null);
    setForm({
      productName: "",
      description: "",
      price: "",
      stockQuantity: ""
    });
    setShowModal(true);
  }

  function openEdit(product) {
    setEditing(product);

    setForm({
      productName: product.productName || "",
      description: product.description || "",
      price: product.price || "",
      stockQuantity: product.stockQuantity || ""
    });

    setShowModal(true);
  }

  function saveProduct(e) {
    e.preventDefault();

    if (!form.productName.trim()) return;

    if (editing) {
      setProducts(prev =>
        prev.map(p =>
          p.id === editing.id
            ? {
                ...p,
                productName: form.productName,
                description: form.description,
                price: Number(form.price || 0),
                stockQuantity: Number(form.stockQuantity || 0)
              }
            : p
        )
      );
    } else {
      const newProduct = {
        id: Date.now(),
        productName: form.productName,
        description: form.description,
        price: Number(form.price || 0),
        stockQuantity: Number(form.stockQuantity || 0),
        status: "AVAILABLE"
      };

      setProducts(prev => [newProduct, ...prev]);
    }

    setShowModal(false);
  }

  function deleteProduct(id) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this product?"
    );

    if (!confirmed) return;

    setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f5f7fb",
        padding: "36px 42px"
      }}
    >

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "28px"
        }}
      >
        <div>
          <div
            style={{
              color: "#2864e6",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "2.5px",
              marginBottom: "8px"
            }}
          >
            VENDOR WORKSPACE
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              color: "#17233c",
              fontSize: "36px",
              fontWeight: "800"
            }}
          >
            My Products
          </h1>

          <p
            style={{
              margin: 0,
              color: "#75839a",
              fontSize: "15px"
            }}
          >
            Manage products listed in your store.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={load}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #dce3ee",
              background: "#fff",
              borderRadius: "10px",
              padding: "11px 16px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={openAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              background: "#2864e6",
              color: "#fff",
              borderRadius: "10px",
              padding: "11px 18px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: "18px",
          marginBottom: "24px"
        }}
      >
        <Summary
          icon={<Package size={21} />}
          title="My Products"
          value={products.length}
          note="Products listed"
        />

        <Summary
          icon={<Boxes size={21} />}
          title="Total Stock"
          value={totalStock}
          note="Units available"
        />

        <Summary
          icon={<IndianRupee size={21} />}
          title="Low Stock"
          value={lowStock}
          note="Products need attention"
        />
      </div>

      {/* SEARCH */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e7ef",
          borderRadius: "14px",
          padding: "13px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "22px"
        }}
      >
        <Search size={19} color="#8995a8" />

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your products..."
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: "14px",
            color: "#202d45"
          }}
        />
      </div>

      {error && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #ffd0d0",
            color: "#c43d3d",
            borderRadius: "12px",
            padding: "13px 16px",
            marginBottom: "20px"
          }}
        >
          {error}
        </div>
      )}

      {/* PRODUCTS */}
      {loading ? (
        <div
          style={{
            background: "#fff",
            padding: "45px",
            borderRadius: "16px",
            textAlign: "center",
            color: "#75839a"
          }}
        >
          Loading your products...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: "20px"
          }}
        >
          {filtered.map(product => {
            const stock = Number(product.stockQuantity || 0);

            return (
              <article
                key={product.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e7ef",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 15px rgba(30,45,75,.045)"
                }}
              >

                <div
                  style={{
                    height: "190px",
                    background: "#eef2f7",
                    overflow: "hidden",
                    position: "relative"
                  }}
                >
                  <img
                    src={getImage(product.productName)}
                    alt={product.productName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: stock > 0 ? "#e9f8ef" : "#ffecec",
                      color: stock > 0 ? "#168344" : "#c43d3d",
                      padding: "6px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "800"
                    }}
                  >
                    {stock > 0 ? "ACTIVE" : "OUT OF STOCK"}
                  </span>
                </div>

                <div style={{ padding: "18px" }}>

                  <div
                    style={{
                      color: "#8995a8",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginBottom: "6px"
                    }}
                  >
                    PRODUCT #{product.id}
                  </div>

                  <h3
                    style={{
                      margin: "0 0 7px",
                      color: "#202d45",
                      fontSize: "18px"
                    }}
                  >
                    {product.productName}
                  </h3>

                  <p
                    style={{
                      color: "#8995a8",
                      fontSize: "13px",
                      minHeight: "38px",
                      margin: "0 0 14px"
                    }}
                  >
                    {product.description ||
                      "Quality product available from your store."}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "13px"
                    }}
                  >
                    <strong
                      style={{
                        color: "#17233c",
                        fontSize: "21px"
                      }}
                    >
                      ₹{Number(product.price || 0).toLocaleString("en-IN")}
                    </strong>

                    <span
                      style={{
                        color: stock <= 5 ? "#d34b4b" : "#168344",
                        fontSize: "12px",
                        fontWeight: "800"
                      }}
                    >
                      {stock} units
                    </span>
                  </div>

                  <div
                    style={{
                      height: "6px",
                      background: "#e9edf3",
                      borderRadius: "10px",
                      overflow: "hidden",
                      marginBottom: "16px"
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(stock * 10, 100)}%`,
                        height: "100%",
                        background: stock <= 5 ? "#e26b25" : "#2864e6",
                        borderRadius: "10px"
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "9px"
                    }}
                  >
                    <button
                      onClick={() => openEdit(product)}
                      style={{
                        border: "1px solid #dce3ee",
                        background: "#fff",
                        color: "#2864e6",
                        borderRadius: "9px",
                        padding: "10px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      style={{
                        border: "1px solid #ffd2d2",
                        background: "#fff6f6",
                        color: "#c43d3d",
                        borderRadius: "9px",
                        padding: "10px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !filtered.length && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e7ef",
            borderRadius: "16px",
            padding: "55px",
            textAlign: "center",
            color: "#8995a8"
          }}
        >
          <Package size={42} />
          <h3 style={{ color: "#202d45" }}>No products found</h3>
          <p>Try another search or add a new product.</p>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#fff",
              borderRadius: "18px",
              padding: "26px",
              boxShadow: "0 20px 60px rgba(0,0,0,.18)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "22px"
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: "#202d45" }}>
                  {editing ? "Edit Product" : "Add Product"}
                </h2>
                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#8995a8",
                    fontSize: "13px"
                  }}
                >
                  {editing
                    ? "Update your product information."
                    : "Add a product to your store."}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  border: "none",
                  background: "#f1f4f8",
                  borderRadius: "9px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveProduct}>

              <Field
                label="Product Name"
                value={form.productName}
                onChange={v =>
                  setForm({ ...form, productName: v })
                }
                placeholder="Example: Gaming Laptop"
              />

              <Field
                label="Description"
                value={form.description}
                onChange={v =>
                  setForm({ ...form, description: v })
                }
                placeholder="Describe your product"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px"
                }}
              >
                <Field
                  label="Price"
                  type="number"
                  value={form.price}
                  onChange={v =>
                    setForm({ ...form, price: v })
                  }
                  placeholder="65000"
                />

                <Field
                  label="Stock"
                  type="number"
                  value={form.stockQuantity}
                  onChange={v =>
                    setForm({ ...form, stockQuantity: v })
                  }
                  placeholder="10"
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  border: "none",
                  background: "#2864e6",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                  marginTop: "8px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <CheckCircle2 size={17} />
                {editing ? "Save Changes" : "Create Product"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: "15px",
        color: "#39465d",
        fontSize: "13px",
        fontWeight: "700"
      }}
    >
      {label}

      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginTop: "7px",
          border: "1px solid #dce3ee",
          borderRadius: "9px",
          padding: "11px 12px",
          outline: "none",
          fontSize: "14px"
        }}
      />
    </label>
  );
}

function Summary({ icon, title, value, note }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e7ef",
        borderRadius: "15px",
        padding: "19px",
        boxShadow: "0 3px 12px rgba(30,45,75,.045)"
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "11px",
          background: "#edf4ff",
          color: "#2864e6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "13px"
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#7d899d",
          fontSize: "12px",
          fontWeight: "700"
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#17233c",
          fontSize: "25px",
          fontWeight: "800",
          margin: "5px 0"
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#9aa5b6",
          fontSize: "11px"
        }}
      >
        {note}
      </div>
    </div>
  );
}