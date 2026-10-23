import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, Package, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";

export default function Products() {
  const [products,setProducts] = useState([]);
  const [query,setQuery] = useState("");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const { addToCart } = useApp();

  const load = async () => {
    setLoading(true);
    setError("");
    try { setProducts(await api.products() || []); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    products.filter(p =>
      `${p.productName} ${p.description || ""}`.toLowerCase()
        .includes(query.toLowerCase())
    ), [products,query]);

  return (
    <div className="container">
      <div className="page-title-row">
        <div><span className="eyebrow">MARKETPLACE</span><h1>Explore Products</h1><p>Products available across your marketplace.</p></div>
        <button className="secondary-button" onClick={load}><RefreshCw size={16}/> Refresh</button>
      </div>

      <div className="search-panel">
        <Search size={19}/>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..."/>
      </div>

      {error && <div className="error-box">{error}</div>}
      {loading ? <div className="loading">Loading products...</div> : (
        <div className="product-grid">
          {filtered.map(p => (
            <article className="product-card" key={p.id}>
              <div className="product-image"><Package size={48}/></div>
              <div className="product-body">
                <div className="status-pill success">{p.status || "AVAILABLE"}</div>
                <h3>{p.productName}</h3>
                <p>{p.description || "Quality product from a marketplace vendor."}</p>
                <div className="product-meta">
                  <strong>₹{Number(p.price || 0).toLocaleString("en-IN")}</strong>
                  <span>{p.stockQuantity ?? 0} in stock</span>
                </div>
                <div className="product-actions">
                  <Link className="secondary-button" to={`/products/${p.id}`}>View</Link>
                  <button
                    className="primary-button"
                    disabled={!p.stockQuantity}
                    onClick={()=>addToCart(p)}
                  >
                    <ShoppingCart size={16}/> Add
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!filtered.length && <div className="empty-state">No products found.</div>}
        </div>
      )}
    </div>
  );
}
