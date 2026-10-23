import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Store } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container nav-content">
        <Link to="/" className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-name">MarketGrid</div>
            <div className="brand-tagline">Marketplace Platform</div>
          </div>
        </Link>

        <div className="search-box">
          <Search size={18} />
          <input placeholder="Search products, brands and vendors..." />
        </div>

        <nav className="nav-links">
          <Link to="/products">Products</Link>
          <Link to="/vendor"><Store size={17} /> Vendor</Link>
          <Link to="/orders">Orders</Link>
        </nav>

        <div className="nav-actions">
          <Link to="/cart" className="icon-button">
            <ShoppingCart size={20} />
          </Link>
          <Link to="/login" className="login-button">
            <User size={17} /> Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
