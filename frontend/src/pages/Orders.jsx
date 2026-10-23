import React, { useEffect, useState } from "react";
import { Package, RefreshCw, ChevronRight, Clock3 } from "lucide-react";
import { api } from "../services/api";

export default function Orders() {
  const [orders,setOrders] = useState([]);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try { setOrders(await api.orders() || []); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(()=>{load()},[]);

  return (
    <div className="container">
      <div className="page-title-row">
        <div><span className="eyebrow">ORDER MANAGEMENT</span><h1>Your Orders</h1><p>Track purchases across marketplace vendors.</p></div>
        <button className="secondary-button" onClick={load}><RefreshCw size={16}/> Refresh</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? <div className="loading">Loading orders...</div> : (
        <div className="orders-list">
          {orders.map(o=>(
            <article className="order-card" key={o.id}>
              <div className="order-icon"><Package/></div>
              <div className="order-main">
                <div className="order-head">
                  <div><strong>Order #{o.id}</strong><span>Customer #{o.customerId}</span></div>
                  <span className={`status-pill ${String(o.status).toLowerCase()==="placed"?"blue":"success"}`}>{o.status}</span>
                </div>

                <div className="order-items">
                  {(o.items || []).map((i,index)=>
                    <div key={index}>
                      Product #{i.productId} · Vendor #{i.vendorId} · Qty {i.quantity}
                    </div>
                  )}
                </div>

                <div className="order-foot">
                  <span><Clock3 size={15}/> Tenant #{o.tenantId}</span>
                  <strong>₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</strong>
                  <ChevronRight size={18}/>
                </div>
              </div>
            </article>
          ))}

          {!orders.length && <div className="empty-state">No orders available yet.</div>}
        </div>
      )}
    </div>
  );
}
