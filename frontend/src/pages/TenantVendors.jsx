import React,{useEffect,useMemo,useState} from "react";
import {RefreshCw,Store,Users,Search,Package,Building2,AlertCircle} from "lucide-react";
import {api} from "../services/api";

export default function TenantVendors(){
  const [vendors,setVendors]=useState([]);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=async()=>{
    setLoading(true);setError("");
    try{
      const data=await api.vendors();
      setVendors(Array.isArray(data)?data:[]);
    }catch(e){
      setError(e.message||"Unable to load vendors for this tenant.");
    }finally{setLoading(false);}
  };

  useEffect(()=>{load();},[]);

  const filtered=useMemo(()=>vendors.filter(v=>
    [v.vendorName,v.businessName,v.email,v.status].some(value=>
      String(value||"").toLowerCase().includes(query.toLowerCase().trim())
    )
  ),[vendors,query]);

  const active=vendors.filter(v=>String(v.status||"").toUpperCase()==="ACTIVE").length;

  return <div className="content">
    <div className="page-head">
      <div><p className="eyebrow">TENANT VENDOR MANAGEMENT</p><h1>Vendors</h1><p>Live vendor profiles belonging to your authenticated tenant.</p></div>
      <button className="secondary-btn" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button>
    </div>

    {error&&<div className="error-box" role="alert">{error}</div>}

    <div className="stats">
      <div className="stat"><div className="stat-icon blue"><Store size={20}/></div><div><span>Total Vendors</span><strong>{loading?"—":vendors.length}</strong><small>Backend records</small></div></div>
      <div className="stat"><div className="stat-icon green"><Users size={20}/></div><div><span>Active Vendors</span><strong>{loading?"—":active}</strong><small>Active profiles</small></div></div>
      <div className="stat"><div className="stat-icon purple"><Building2 size={20}/></div><div><span>Tenant</span><strong>#{localStorage.getItem("marketgrid_tenant")||"—"}</strong><small>JWT tenant context</small></div></div>
    </div>

    <div className="table-card">
      <div className="table-head">
        <div><b>Vendor Directory</b><small>{loading?"Loading vendors...":filtered.length+" records"}</small></div>
        <div className="global-search" style={{maxWidth:360,margin:0}}><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search vendor, business, email..."/></div>
      </div>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th>ID</th><th>VENDOR</th><th>BUSINESS</th><th>EMAIL</th><th>STATUS</th></tr></thead>
          <tbody>
            {loading&&<tr><td colSpan="5" style={{textAlign:"center",padding:28}}>Loading vendor records...</td></tr>}
            {!loading&&filtered.map(v=><tr key={v.id}>
              <td>#{v.id}</td>
              <td><b>{v.vendorName||"Unnamed vendor"}</b></td>
              <td>{v.businessName||"—"}</td>
              <td>{v.email||"—"}</td>
              <td><span className={"badge "+(String(v.status||"").toUpperCase()==="ACTIVE"?"green":"orange")}>{v.status||"UNKNOWN"}</span></td>
            </tr>)}
            {!loading&&!error&&!filtered.length&&<tr><td colSpan="5" style={{textAlign:"center",padding:28}}><AlertCircle size={20}/> No vendors found for this tenant.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    <p style={{color:"#75839a",fontSize:13,marginTop:14}}><Package size={14} style={{verticalAlign:"middle"}}/> Vendor account creation is restricted to the approved administrator onboarding workflow.</p>
  </div>;
}
