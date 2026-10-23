import React, { useEffect, useState } from "react";
import { Store, Mail, Phone, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "../services/api";

export default function Vendors() {
  const [vendors,setVendors] = useState([]);
  const [error,setError] = useState("");

  const load = async () => {
    try { setVendors(await api.vendors() || []); }
    catch(e) { setError(e.message); }
  };

  useEffect(()=>{load()},[]);

  return (
    <div className="container">
      <div className="page-title-row">
        <div><span className="eyebrow">SELLER NETWORK</span><h1>Trusted Vendors</h1><p>Discover independent sellers operating on MarketGrid.</p></div>
        <button className="secondary-button" onClick={load}><RefreshCw size={16}/> Refresh</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="vendor-grid">
        {vendors.map(v=>(
          <article className="vendor-card" key={v.id}>
            <div className="vendor-avatar"><Store size={25}/></div>
            <div className="vendor-main">
              <span className="status-pill success">{v.status || "ACTIVE"}</span>
              <h3>{v.businessName || v.vendorName}</h3>
              <p>{v.vendorName}</p>
              <div className="vendor-contact"><Mail size={14}/>{v.email}</div>
              {v.phone && <div className="vendor-contact"><Phone size={14}/>{v.phone}</div>}
            </div>
            <button className="icon-button"><ArrowRight size={18}/></button>
          </article>
        ))}
        {!vendors.length && <div className="empty-state">No vendors found.</div>}
      </div>
    </div>
  );
}
