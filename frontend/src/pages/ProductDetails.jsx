import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Package, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";

export default function ProductDetails() {
  const { id } = useParams();
  const [product,setProduct] = useState(null);
  const [error,setError] = useState("");
  const { addToCart } = useApp();

  useEffect(() => {
    api.product(id).then(setProduct).catch(e=>setError(e.message));
  },[id]);

  if(error) return <div className="container"><div className="error-box">{error}</div></div>;
  if(!product) return <div className="loading">Loading product...</div>;

  return (
    <div className="container">
      <Link to="/products" className="back-link"><ArrowLeft size={16}/> Back to products</Link>
      <div className="detail-card">
        <div className="detail-image"><Package size={100}/></div>
        <div className="detail-info">
          <span className="status-pill success">{product.status || "AVAILABLE"}</span>
          <h1>{product.productName}</h1>
          <p>{product.description || "Premium product available from MarketGrid."}</p>
          <div className="detail-price">₹{Number(product.price || 0).toLocaleString("en-IN")}</div>
          <div className="detail-stock">{product.stockQuantity} units available</div>
          <div className="detail-actions">
            <button className="primary-button" onClick={()=>addToCart(product)}>
              <ShoppingCart size={18}/> Add to Cart
            </button>
          </div>
          <div className="secure-note"><ShieldCheck size={17}/> Secure marketplace purchase</div>
        </div>
      </div>
    </div>
  );
}
