import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Cart() {
  const {
    cart, cartTotal, cartCount,
    changeQuantity, removeFromCart
  } = useApp();
  const navigate = useNavigate();

  if(!cart.length) return (
    <div className="container">
      <div className="empty-large">
        <ShoppingBag size={54}/>
        <h1>Your cart is empty</h1>
        <p>Explore the marketplace and add products to your cart.</p>
        <Link className="primary-button" to="/products">Start Shopping</Link>
      </div>
    </div>
  );

  const vendors = new Set(cart.map(x=>x.vendorId)).size;

  return (
    <div className="container">
      <div className="page-title-row">
        <div><span className="eyebrow">SHOPPING CART</span><h1>Your Cart</h1><p>{cartCount} items from {vendors} vendor{vendors !== 1 ? "s" : ""}.</p></div>
      </div>

      <div className="checkout-grid">
        <div className="cart-list">
          {cart.map(item=>(
            <div className="cart-item" key={item.id}>
              <div className="cart-product-icon"><ShoppingBag/></div>
              <div className="cart-info">
                <h3>{item.productName}</h3>
                <span>Vendor #{item.vendorId}</span>
                <strong>₹{Number(item.price).toLocaleString("en-IN")}</strong>
              </div>

              <div className="qty-control">
                <button onClick={()=>changeQuantity(item.id,item.quantity-1)}><Minus size={15}/></button>
                <span>{item.quantity}</span>
                <button onClick={()=>changeQuantity(item.id,item.quantity+1)}><Plus size={15}/></button>
              </div>

              <strong className="line-total">
                ₹{(Number(item.price)*item.quantity).toLocaleString("en-IN")}
              </strong>

              <button className="danger-icon" onClick={()=>removeFromCart(item.id)}><Trash2 size={17}/></button>
            </div>
          ))}
        </div>

        <aside className="summary-card">
          <h2>Order Summary</h2>
          <div className="summary-line"><span>Subtotal</span><strong>₹{cartTotal.toLocaleString("en-IN")}</strong></div>
          <div className="summary-line"><span>Delivery</span><strong>Free</strong></div>
          <div className="summary-line total"><span>Total</span><strong>₹{cartTotal.toLocaleString("en-IN")}</strong></div>
          <button className="primary-button full" onClick={()=>navigate("/checkout")}>
            Proceed to Checkout <ArrowRight size={17}/>
          </button>
          <div className="secure-note"><ShieldCheck size={16}/> Secure checkout</div>
        </aside>
      </div>
    </div>
  );
}
