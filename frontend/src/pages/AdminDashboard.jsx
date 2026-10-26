import {useEffect,useState} from "react";
import {Link,Navigate} from "react-router-dom";
import {Package,Users,ShoppingCart,Store,RefreshCw} from "lucide-react";
import {api} from "../services/api";

export default function AdminDashboard(){
  const [data,setData]=useState({products:[],vendors:[],orders:[],tenants:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [refresh,setRefresh]=useState(0);
  const role=localStorage.getItem("marketgrid_role");

  useEffect(()=>{
    if(role!=="SUPER_ADMIN")return;
    let active=true;
    async function load(){
      setLoading(true);setError("");
      try{
        const [products,vendors,orders,tenants]=await Promise.all([
          api.products(),api.vendors(),api.orders(),api.tenants()
        ]);
        if(active)setData({
          products:Array.isArray(products)?products:[],
          vendors:Array.isArray(vendors)?vendors:[],
          orders:Array.isArray(orders)?orders:[],
          tenants:Array.isArray(tenants)?tenants:[]
        });
      }catch(e){if(active)setError(e.message||"Unable to load platform dashboard data.");}
      finally{if(active)setLoading(false);}
    }
    load();return()=>{active=false;};
  },[role,refresh]);

  if(role!=="SUPER_ADMIN")return <Navigate to="/login" replace/>;

  const value=data.orders.reduce((sum,order)=>sum+Number(order.totalAmount||0),0);
  const cards=[
    [Package,"Products",data.products.length,"/admin/products"],
    [Store,"Vendors",data.vendors.length,"/admin/vendors"],
    [ShoppingCart,"Orders",data.orders.length,"/admin/orders"],
    [Users,"Tenants",data.tenants.filter(t=>t.active).length,"/admin/tenants"]
  ];

  return <div className="content">
    <div className="page-head">
      <div><p className="eyebrow">PLATFORM ADMINISTRATION</p><h1>Super Admin Dashboard</h1><p>Live marketplace records returned by the backend services.</p></div>
      <button className="secondary-btn" onClick={()=>setRefresh(v=>v+1)} disabled={loading}><RefreshCw size={16}/> Refresh</button>
    </div>
    {error&&<div className="error-box" role="alert">{error}</div>}
    <div className="stats">
      {cards.map(([Icon,label,count,href])=><Link key={label} to={href} className="stat" style={{textDecoration:"none",color:"inherit"}}>
        <div className="stat-icon blue"><Icon size={20}/></div><div><span>{label}</span><strong>{loading?"—":count}</strong><small>Live API data</small></div>
      </Link>)}
    </div>
    <div className="table-card">
      <div className="table-head"><b>Marketplace Summary</b><small>{loading?"Loading...":data.orders.length+" orders · "+data.products.length+" products"}</small></div>
      <div style={{padding:24}}><span>Recorded order value</span><h2 style={{margin:"8px 0"}}>{loading?"—":"₹"+value.toLocaleString("en-IN")}</h2><p className="muted">Calculated from the current order records; this is not a payment settlement report.</p></div>
    </div>
  </div>;
}
