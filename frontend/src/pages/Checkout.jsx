import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MapPin, CreditCard, Package } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useApp();
  const navigate = useNavigate();
  const [form,setForm] = useState({
    name:"", address:"", city:"", phone:""
  });
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  if(!cart.length) {
    return <div className="container"><div className="empty-large"><h1>No items to checkout</h1></div></div>;
  }

  const placeOrder = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      tenantId: 1,
      customerId: 1,
      items: cart.map(x=>({
        productId: x.id,
        vendorId: x.vendorId,
        quantity: x.quantity,
        price: x.price
      }))
    };

    try {
      await api.createOrder(body);
      clearCart();
      navigate("/orders");
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-title-row">
        <div><span className="eyebrow">CHECKOUT</span><h1>Complete your order</h1><p>One checkout for products from multiple vendors.</p></div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={placeOrder}>
          <section className="form-section">
            <div className="form-section-title"><MapPin/><div><h2>Delivery details</h2><p>Where should we deliver your order?</p></div></div>

            <label>Full name</label>
            <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>

            <label>Phone number</label>
            <input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>

            <label>Address</label>
            <textarea required rows="3" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>

            <label>City</label>
            <input required value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/>
          </section>

          <section className="form-section">
            <div className="form-section-title"><CreditCard/><div><h2>Payment</h2><p>Payment service integration is prepared for the next backend phase.</p></div></div>
            <div className="payment-placeholder">
              <CheckCircle2/> Secure payment workflow
            </div>
          </section>

          <button className="primary-button full" disabled={loading}>
            {loading ? "Placing order..." : "Place Order"}
          </button>
        </form>

        <aside className="summary-card">
          <h2>Items</h2>
          {cart.map(x=>
            <div className="mini-order-item" key={x.id}>
              <Package size={18}/>
              <span>{x.productName} × {x.quantity}</span>
              <strong>₹{(Number(x.price)*x.quantity).toLocaleString("en-IN")}</strong>
            </div>
          )}
          <div className="summary-line total"><span>Total</span><strong>₹{cartTotal.toLocaleString("en-IN")}</strong></div>
        </aside>
      </div>
    </div>
  );
}
