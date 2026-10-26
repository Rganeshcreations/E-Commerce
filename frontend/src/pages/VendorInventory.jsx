import React,{useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {RefreshCw,Save,ArrowLeft,Boxes} from "lucide-react";
import {api} from "../services/api";

export default function VendorInventory(){
  const [products,setProducts]=useState([]);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(null);

  const load=async()=>{
    try{
      setError("");
      const vendor=await api.myVendor();
      const data=await api.productsByVendor(vendor.id);
      setProducts((data||[]).map(p=>({...p,editStock:p.stockQuantity??0})));
    }catch(e){setError(e.message)}
  };

  useEffect(()=>{load()},[]);

  const save=async(p)=>{
    try{
      setSaving(p.id);
      const body={...p,stockQuantity:Number(p.editStock)};
      delete body.editStock;
      await api.updateProduct(p.id,body);
      await load();
    }catch(e){setError(e.message)}
    finally{setSaving(null)}
  };

  return <div className="container">
    <div className="page-title-row">
      <div><span className="eyebrow">INVENTORY MANAGEMENT</span><h1>Inventory</h1><p>View and update stock for your products.</p></div>
      <button className="secondary-button" onClick={load}><RefreshCw size={16}/> Refresh</button>
    </div>
    {error&&<div className="error-box">{error}</div>}
    <div className="panel">
      <div className="panel-head"><div><h2><Boxes size={20}/> Stock Levels</h2><p>Only your vendor products are shown.</p></div></div>
      <div style={{display:"grid",gap:"12px"}}>
        {products.map(p=><div key={p.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:"15px",alignItems:"center",padding:"15px",border:"1px solid #e6eaf1",borderRadius:"12px"}}>
          <div><strong>{p.productName}</strong><small style={{display:"block",color:"#8290a8"}}>Product #{p.id}</small></div>
          <div>₹{Number(p.price||0).toLocaleString("en-IN")}</div>
          <input className="input" type="number" min="0" value={p.editStock} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,editStock:e.target.value}:x))}/>
          <button className="primary-button" disabled={saving===p.id} onClick={()=>save(p)}><Save size={15}/>{saving===p.id?"Saving":"Save"}</button>
        </div>)}
        {!products.length&&<div className="empty-state">No products found.</div>}
      </div>
    </div>
    <div style={{marginTop:"24px"}}><Link className="secondary-button" to="/vendor"><ArrowLeft size={16}/> Back to Dashboard</Link></div>
  </div>
}