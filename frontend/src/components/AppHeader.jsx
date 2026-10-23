import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ShoppingCart, UserRound, Store, Package,
  LogOut, LayoutDashboard
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function AppHeader() {
  const { user, logout, cartCount } = useApp();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark">M</span>
        <span>
          <strong>MarketGrid</strong>
          <small>Marketplace Platform</small>
        </span>
      </Link>

      <div className="global-search">
        <Search size={18}/>
        <input placeholder="Search products, brands and vendors..."/>
      </div>

      <nav className="main-nav">
        <Link to="/products">Products</Link>
        <Link to="/vendors"><Store size={16}/> Vendors</Link>
        <Link to="/orders"><Package size={16}/> Orders</Link>

        <Link to="/cart" className="cart-button">
          <ShoppingCart size={19}/>
          {cartCount > 0 && <span>{cartCount}</span>}
        </Link>

        {user ? (
          <div className="user-menu">
            <button
              className="avatar-button"
              onClick={() => navigate("/vendor")}
            >
              <UserRound size={17}/>
              <span>{user.email?.split("@")[0] || "Account"}</span>
            </button>
            <button className="icon-button" onClick={logout} title="Sign out">
              <LogOut size={17}/>
            </button>
          </div>
        ) : (
          <Link className="primary-button small" to="/login">
            <UserRound size={17}/> Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
