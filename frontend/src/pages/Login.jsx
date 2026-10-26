import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Building2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    tenantId: "1"
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login({
        email: form.email,
        password: form.password,
        tenantId: Number(form.tenantId)
      });
      login(data);
      const destinations = { SUPER_ADMIN: "/admin", TENANT_ADMIN: "/admin", VENDOR: "/vendor", CUSTOMER: "/products" };
      navigate(destinations[data.role] || "/login", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="brand-mark">M</span>
          <span><strong>MarketGrid</strong><small>Secure Marketplace</small></span>
        </Link>

        <h1>Welcome back</h1>
        <p className="muted">Sign in to continue to your MarketGrid account.</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={submit}>
          <label>Email address</label>
          <div className="input-wrap">
            <Mail size={17}/>
            <input
              value={form.email}
              onChange={e => setForm({...form,email:e.target.value})}
              type="email"
              required
            />
          </div>

          <label>Password</label>
          <div className="input-wrap">
            <Lock size={17}/>
            <input
              value={form.password}
              onChange={e => setForm({...form,password:e.target.value})}
              type={show ? "text" : "password"}
              required
            />
            <button type="button" onClick={() => setShow(!show)} className="input-action">
              {show ? <EyeOff size={17}/> : <Eye size={17}/>}
            </button>
          </div>

          <label>Tenant ID</label>
          <div className="input-wrap">
            <Building2 size={17}/>
            <input
              value={form.tenantId}
              onChange={e => setForm({...form,tenantId:e.target.value})}
              type="number"
              min="1"
              required
            />
          </div>

          <button className="primary-button full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="secure-note">
          <ShieldCheck size={17}/>
          Protected with JWT authentication
        </div>

        <Link to="/" className="back-link">? Back to MarketGrid</Link>
      </div>
    </div>
  );
}
