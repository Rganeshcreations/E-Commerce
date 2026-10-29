import React, { useEffect, useMemo, useState } from "react";
import {
  Package, Boxes, RefreshCw, ShoppingBag, IndianRupee,
  Plus, Store, AlertCircle, CheckCircle2, Pencil, Trash2, PackagePlus, X, Save
} from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";

const money = value => Number(value || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 2
});

export default function VendorProducts() {
  const { logout } = useApp();
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState(null);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [message, setMessage] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    setCatalogError("");
    try {
      const vendor = await api.myVendor();
      const [productResult, catalogResult] = await Promise.allSettled([
        api.productsByVendor(vendor.id),
        api.tenantCatalog()
      ]);

      if (productResult.status === "fulfilled") {
        setProducts(Array.isArray(productResult.value) ? productResult.value : []);
      } else {
        setError(productResult.reason?.message || "Unable to load your products.");
      }

      if (catalogResult.status === "fulfilled") {
        const rows = Array.isArray(catalogResult.value) ? catalogResult.value : [];
        setCatalog(rows.filter(item =>
          String(item.status || "").toUpperCase() === "ACTIVE" &&
          Number(item.availableQuantity || 0) > 0
        ));
      } else {
        setCatalog([]);
        setCatalogError(
          catalogResult.reason?.message ||
          "Unable to load the tenant catalog. Please refresh and try again."
        );
      }
    } catch (e) {
      setError(e.message || "Unable to verify your vendor profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.stockQuantity || 0), 0),
    [products]
  );

  const updateForm = (id, field, value) => {
    setForms(current => ({
      ...current,
      [id]: {
        quantity: current[id]?.quantity ?? "1",
        sellingPrice: current[id]?.sellingPrice ?? "",
        ...current[id],
        [field]: value
      }
    }));
  };

  const allocate = async item => {
    const form = forms[item.id] || {};
    const quantity = Number(form.quantity ?? 1);
    const sellingPrice = Number(
      form.sellingPrice === undefined || form.sellingPrice === ""
        ? item.wholesalePrice
        : form.sellingPrice
    );

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Allocation quantity must be a whole number greater than zero.");
      return;
    }
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      setError("Enter a valid non-negative selling price.");
      return;
    }
    if (quantity > Number(item.availableQuantity)) {
      setError(`Only ${item.availableQuantity} units of ${item.productName} are available.`);
      return;
    }

    setError("");
    setMessage("");
    setAllocatingId(item.id);
    try {
      await api.allocateCatalogProduct(item.id, { quantity, sellingPrice });
      setMessage(`${item.productName} was added to your products with ${quantity} unit(s).`);
      setForms(current => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      await load();
    } catch (e) {
      setError(e.message || "Unable to allocate this catalog product.");
    } finally {
      setAllocatingId(null);
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!editingProduct) return;

    const price = Number(editingProduct.price);
    const stockQuantity = Number(editingProduct.stockQuantity);

    if (!editingProduct.productName?.trim() ||
        !Number.isFinite(price) || price < 0 ||
        !Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setError("Enter a product name, valid price, and non-negative whole-number stock.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.updateProduct(editingProduct.id, {
        productName: editingProduct.productName.trim(),
        description: editingProduct.description || "",
        price,
        stockQuantity,
        status: editingProduct.status
      });
      setEditingProduct(null);
      setMessage("Product updated successfully.");
      await load();
    } catch (e) {
      setError(e.message || "Unable to update product.");
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete "${product.productName}"? This action may be permanent.`)) return;

    setDeletingId(product.id);
    setError("");
    setMessage("");
    try {
      await api.deleteProduct(product.id);
      setMessage("Product deleted successfully.");
      await load();
    } catch (e) {
      setError(e.message || "Unable to delete product.");
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div style={{ minHeight: "100%", background: "#f5f7fb", padding: "36px 42px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        gap: 20, flexWrap: "wrap", marginBottom: 26
      }}>
        <div>
          <div style={{
            color: "#2864e6", fontSize: 12, fontWeight: 800,
            letterSpacing: "2.5px", marginBottom: 8
          }}>VENDOR WORKSPACE</div>
          <h1 style={{ margin: "0 0 8px", color: "#17233c", fontSize: 36, fontWeight: 800 }}>
            My Products
          </h1>
          <p style={{ margin: 0, color: "#75839a", fontSize: 15 }}>
            Choose stock from your tenant catalog and set your selling price.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={load} disabled={loading} style={secondaryButton}>
            <RefreshCw size={16} /> {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" onClick={() => { logout(); window.location.assign("/login"); }}
            style={{ ...secondaryButton, color: "#b42318", background: "#fff5f5", border: "1px solid #fecaca" }}>
            Exit
          </button>
        </div>
      </div>

      {error && <Notice type="error">{error}</Notice>}
      {message && <Notice type="success">{message}</Notice>}

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
        gap: 16, marginBottom: 28
      }}>
        <Summary icon={<Package size={21} />} title="My Products" value={products.length} note="Products listed in your store" />
        <Summary icon={<Boxes size={21} />} title="Total Stock" value={totalStock} note="Units allocated to you" />
        <Summary icon={<Store size={21} />} title="Available Catalog Items" value={catalog.length} note="Items with stock available" />
      </div>

      <section id="tenant-catalog" style={panel}>
        <div style={sectionHeader}>
          <div>
            <h2 style={sectionTitle}><Store size={20} /> Available from Your Tenant</h2>
            <p style={sectionSubtitle}>
              Allocate available tenant stock to your store. Allocation reduces the tenant's available quantity.
            </p>
          </div>
          <span style={countPill}>{catalog.length} available</span>
        </div>

        {catalogError && <Notice type="error">{catalogError}</Notice>}

        {loading ? (
          <div style={emptyStyle}>Loading tenant catalog...</div>
        ) : catalog.length === 0 && !catalogError ? (
          <div style={emptyStyle}>
            <Boxes size={36} color="#2864e6" />
            <h3 style={{ margin: "12px 0 6px", color: "#202d45" }}>No stock available</h3>
            <p style={{ margin: 0 }}>Your tenant administrator must add stock to the tenant catalog first.</p>
          </div>
        ) : (
          <div style={gridStyle}>
            {catalog.map(item => {
              const form = forms[item.id] || {};
              const quantity = form.quantity ?? "1";
              const sellingPrice = form.sellingPrice ?? String(item.wholesalePrice ?? "");
              return (
                <article key={item.id} style={cardStyle}>
                  <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    gap: 12, marginBottom: 12
                  }}>
                    <div style={{
                      width: 44, height: 44, flexShrink: 0, borderRadius: 12,
                      background: "#edf4ff", color: "#2864e6",
                      display: "grid", placeItems: "center"
                    }}><Package size={22} /></div>
                    <span style={stockPill}>{item.availableQuantity} units available</span>
                  </div>
                  <h3 style={{ margin: "0 0 7px", color: "#202d45", fontSize: 18 }}>
                    {item.productName}
                  </h3>
                  <p style={{ margin: "0 0 14px", minHeight: 38, color: "#75839a", fontSize: 13 }}>
                    {item.description || "Product supplied by your tenant."}
                  </p>
                  <div style={{ marginBottom: 16, color: "#75839a", fontSize: 13 }}>
                    Tenant wholesale price: <strong style={{ color: "#202d45" }}>â‚¹{money(item.wholesalePrice)}</strong>
                  </div>

                  <label style={fieldLabel} htmlFor={`quantity-${item.id}`}>Quantity to allocate</label>
                  <input
                    id={`quantity-${item.id}`}
                    type="number" min="1" max={item.availableQuantity} step="1"
                    value={quantity}
                    onChange={event => updateForm(item.id, "quantity", event.target.value)}
                    style={fieldStyle}
                  />
                  <label style={fieldLabel} htmlFor={`price-${item.id}`}>Your selling price (â‚¹)</label>
                  <input
                    id={`price-${item.id}`}
                    type="number" min="0" step="0.01"
                    value={sellingPrice}
                    onChange={event => updateForm(item.id, "sellingPrice", event.target.value)}
                    style={fieldStyle}
                  />
                  <button
                    onClick={() => allocate(item)}
                    disabled={allocatingId !== null || Number(item.availableQuantity) < 1}
                    style={{ ...primaryButton, width: "100%", marginTop: 8 }}
                  >
                    <Plus size={16} />
                    {allocatingId === item.id ? "Allocating..." : "Add to My Products"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ ...panel, marginTop: 24 }}>
        <div style={sectionHeader}>
          <div>
            <h2 style={sectionTitle}><ShoppingBag size={20} /> My Store Products</h2>
            <p style={sectionSubtitle}>These are the products allocated to your vendor account.</p>
          </div>
          <span style={countPill}>{products.length} listed</span>
        </div>

        {loading ? (
          <div style={emptyStyle}>Loading your products...</div>
        ) : products.length === 0 ? (
          <div style={emptyStyle}>
            <Package size={36} color="#2864e6" />
            <h3 style={{ margin: "12px 0 6px", color: "#202d45" }}>No products listed yet</h3>
            <p style={{ margin: 0 }}>Choose a product above when your tenant has stock available.</p>
          </div>
        ) : (
          <div style={gridStyle}>
            {products.map(product => (
              <article key={product.id} style={cardStyle}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, marginBottom: 14
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: "#edf4ff",
                    color: "#2864e6", display: "grid", placeItems: "center"
                  }}><Package size={22} /></div>
                  <span style={Number(product.stockQuantity || 0) > 0 ? stockPill : emptyStockPill}>
                    {product.stockQuantity} units
                  </span>
                </div>
                <h3 style={{ margin: "0 0 8px", color: "#202d45", fontSize: 18 }}>
                  {product.productName}
                </h3>
                <p style={{ margin: "0 0 14px", color: "#75839a", fontSize: 13, minHeight: 36 }}>
                  {product.description || "Your store listing"}
                </p>
                <div style={{ color: "#17233c", fontSize: 21, fontWeight: 800 }}>
                  {"\u20B9"}{money(product.price)}
                </div>
                <div style={actionRow}>
                  <button
                    type="button"
                    style={editButton}
                    onClick={() => {
                      setError("");
                      setEditingProduct({ ...product });
                    }}
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    type="button"
                    style={deleteButton}
                    disabled={deletingId === product.id}
                    onClick={() => removeProduct(product)}
                  >
                    <Trash2 size={15} />
                    {deletingId === product.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {editingProduct && (
        <div style={modalOverlay} onClick={(event) => {
          if (event.target === event.currentTarget && !saving) setEditingProduct(null);
        }}>
          <form style={modalCard} onSubmit={saveProduct}>
            <div style={modalHeader}>
              <div>
                <h2 style={{ margin: 0, color: "#17233c" }}>Edit Product</h2>
                <p style={sectionSubtitle}>{editingProduct.productName}</p>
              </div>
              <button type="button" style={iconButton}
                onClick={() => setEditingProduct(null)} disabled={saving}
                aria-label="Close edit dialog">
                <X size={19} />
              </button>
            </div>

            <label style={fieldLabel}>Product name</label>
            <input style={fieldStyle} required maxLength={255}
              value={editingProduct.productName || ""}
              onChange={e => setEditingProduct(p => ({ ...p, productName: e.target.value }))} />

            <label style={fieldLabel}>Description</label>
            <textarea style={{ ...fieldStyle, minHeight: 90, resize: "vertical" }}
              maxLength={1000} value={editingProduct.description || ""}
              onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))} />

            <label style={fieldLabel}>Selling price (\u20B9)</label>
            <input style={fieldStyle} type="number" min="0" step="0.01" required
              value={editingProduct.price ?? ""}
              onChange={e => setEditingProduct(p => ({ ...p, price: e.target.value }))} />

            <label style={fieldLabel}>Current stock quantity</label>
            <input style={fieldStyle} type="number" min="0" step="1" required
              value={editingProduct.stockQuantity ?? 0}
              onChange={e => setEditingProduct(p => ({ ...p, stockQuantity: e.target.value }))} />

            <div style={modalActions}>
              <button type="button" style={secondaryButton}
                onClick={() => setEditingProduct(null)} disabled={saving}>Cancel</button>
              <button type="submit" style={primaryButton} disabled={saving}>
                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Summary({ icon, title, value, note }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e7ef", borderRadius: 15,
      padding: 19, boxShadow: "0 3px 12px rgba(30,45,75,.045)"
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11, background: "#edf4ff",
        color: "#2864e6", display: "grid", placeItems: "center", marginBottom: 14
      }}>{icon}</div>
      <div style={{ color: "#7d899d", fontSize: 12, fontWeight: 700 }}>{title}</div>
      <div style={{ color: "#17233c", fontSize: 25, fontWeight: 800, margin: "5px 0" }}>{value}</div>
      <div style={{ color: "#9aa5b6", fontSize: 11 }}>{note}</div>
    </div>
  );
}

function Notice({ type, children }) {
  const success = type === "success";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      background: success ? "#ecfdf3" : "#fff0f0",
      border: `1px solid ${success ? "#bbf7d0" : "#ffd0d0"}`,
      color: success ? "#166534" : "#c43d3d",
      borderRadius: 12, padding: "12px 15px", marginBottom: 18
    }}>
      {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{children}</span>
    </div>
  );
}

const panel = {
  background: "#fff", border: "1px solid #e2e7ef", borderRadius: 16,
  padding: 22, boxShadow: "0 3px 12px rgba(30,45,75,.04)"
};
const sectionHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  gap: 15, flexWrap: "wrap", marginBottom: 20
};
const sectionTitle = {
  display: "flex", alignItems: "center", gap: 9, margin: 0,
  color: "#202d45", fontSize: 19, fontWeight: 800
};
const sectionSubtitle = { margin: "6px 0 0", color: "#8995a8", fontSize: 13 };
const countPill = {
  background: "#edf4ff", color: "#2864e6", borderRadius: 20,
  padding: "7px 11px", fontSize: 12, fontWeight: 800
};
const gridStyle = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18
};
const cardStyle = {
  border: "1px solid #e2e7ef", borderRadius: 14, padding: 18,
  background: "#fff", boxShadow: "0 3px 12px rgba(30,45,75,.035)"
};
const fieldLabel = {
  display: "block", margin: "0 0 6px", color: "#53627a", fontSize: 12, fontWeight: 700
};
const fieldStyle = {
  width: "100%", boxSizing: "border-box", marginBottom: 13, padding: "11px 12px",
  border: "1px solid #dce3ee", borderRadius: 9, fontSize: 14, color: "#202d45"
};
const primaryButton = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  border: "none", background: "#2864e6", color: "#fff", borderRadius: 10,
  padding: "11px 15px", fontWeight: 800, cursor: "pointer"
};
const secondaryButton = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  border: "1px solid #dce3ee", background: "#fff", color: "#202d45",
  borderRadius: 10, padding: "11px 16px", fontWeight: 700, cursor: "pointer"
};
const stockPill = {
  background: "#e9f8ef", color: "#168344", borderRadius: 20,
  padding: "6px 9px", fontSize: 11, fontWeight: 800
};
const emptyStockPill = {
  background: "#ffecec", color: "#c43d3d", borderRadius: 20,
  padding: "6px 9px", fontSize: 11, fontWeight: 800
};
const emptyStyle = {
  display: "grid", justifyItems: "center", padding: "38px 18px",
  textAlign: "center", color: "#8995a8"
};

const actionRow = {
  display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18,
  paddingTop: 14, borderTop: "1px solid #edf0f6"
};
const editButton = {
  ...secondaryButton, flex: 1, padding: "9px 10px", fontSize: 12
};
const stockButton = {
  ...editButton, color: "#166534", background: "#ecfdf3", borderColor: "#bbf7d0"
};
const deleteButton = {
  ...editButton, color: "#b42318", background: "#fff5f5", borderColor: "#fecaca"
};
const modalOverlay = {
  position: "fixed", inset: 0, zIndex: 1000,
  background: "rgba(15, 23, 42, .55)", display: "grid",
  placeItems: "center", padding: 16, overflowY: "auto"
};
const modalCard = {
  width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
  boxSizing: "border-box", padding: 24, background: "#fff",
  border: "1px solid #e2e7ef", borderRadius: 20,
  boxShadow: "0 24px 70px rgba(15, 23, 42, .22)"
};
const modalHeader = {
  display: "flex", alignItems: "flex-start",
  justifyContent: "space-between", gap: 16, marginBottom: 22
};
const modalActions = {
  display: "flex", justifyContent: "flex-end",
  gap: 10, flexWrap: "wrap", marginTop: 20
};
const iconButton = {
  display: "grid", placeItems: "center", width: 38, height: 38,
  borderRadius: 10, border: "1px solid #e2e7ef",
  background: "#f8fafc", color: "#475569", cursor: "pointer"
};


