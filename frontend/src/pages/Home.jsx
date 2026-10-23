import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, Truck, Store, Sparkles,
  ShoppingBag, Boxes, BarChart3
} from "lucide-react";

export default function Home() {
  return (
    <div>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15}/> SMART MULTI-VENDOR COMMERCE</div>
          <h1>One marketplace.<br/><span>Thousands of possibilities.</span></h1>
          <p>
            Discover products from trusted vendors, compare offers,
            manage your cart and track every order from one intelligent marketplace.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="primary-button">
              Explore Products <ArrowRight size={18}/>
            </Link>
            <Link to="/vendors" className="secondary-button">
              Browse Vendors
            </Link>
          </div>

          <div className="trust-row">
            <div><ShieldCheck size={18}/><span>Secure JWT Authentication</span></div>
            <div><Truck size={18}/><span>Order Tracking</span></div>
            <div><Store size={18}/><span>Verified Vendors</span></div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="floating-card top">
            <div className="mini-icon blue"><ShoppingBag size={19}/></div>
            <div><strong>Multi-vendor checkout</strong><small>One order • multiple sellers</small></div>
          </div>

          <div className="market-visual">
            <div className="visual-circle"/>
            <div className="visual-box"><Boxes size={54}/></div>
            <span className="visual-label">MARKETGRID</span>
          </div>

          <div className="floating-card bottom">
            <div className="mini-icon green"><BarChart3 size={19}/></div>
            <div><strong>Live marketplace</strong><small>Products • Vendors • Orders</small></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><span className="eyebrow">WHY MARKETGRID</span><h2>Built for modern commerce</h2></div>
        </div>

        <div className="feature-grid">
          <div className="feature-card"><ShieldCheck/><h3>Secure by design</h3><p>JWT authentication, role-based access and tenant-aware APIs.</p></div>
          <div className="feature-card"><Store/><h3>Multiple vendors</h3><p>Independent sellers operate inside one unified marketplace.</p></div>
          <div className="feature-card"><Boxes/><h3>Inventory visibility</h3><p>Products and stock are managed through dedicated services.</p></div>
          <div className="feature-card"><Truck/><h3>Order tracking</h3><p>Follow your purchases from checkout to delivery.</p></div>
        </div>
      </section>
    </div>
  );
}
