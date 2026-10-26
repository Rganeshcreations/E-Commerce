import React,{useEffect,useMemo,useState} from "react";
import {RefreshCw,Store,Users,Search,Package,Building2,AlertCircle,Plus,X} from "lucide-react";
import {api} from "../services/api";

export default function TenantVendors(){
  const [vendors,setVendors]=useState([]);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({
    fullName:"",email:"",password:"",phone:"",businessName:""
  });

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

  async function createVendor(event){
    event.preventDefault();
    setError("");setMessage("");
    if(form.fullName.trim().length<2||!form.businessName.trim()||form.password.length<8){
      setError("Enter the vendor name, business name, and a password with at least 8 characters.");
      return;
    }
    let createdUser=null;
    try{
      setSaving(true);
      createdUser=await api.createUser({
        fullName:form.fullName.trim(),
        email:form.email.trim().toLowerCase(),
        password:form.password,
        tenantId:Number(localStorage.getItem("marketgrid_tenant")),
        role:"VENDOR"
      });
      try{
        await api.createVendor({
          tenantId:Number(localStorage.getItem("marketgrid_tenant")),
          vendorName:form.fullName.trim(),
          email:form.email.trim().toLowerCase(),
          phone:form.phone.trim(),
          businessName:form.businessName.trim(),
          status:"ACTIVE"
        });
      }catch(vendorError){
        if(createdUser?.id){
          try{await api.deleteUser(createdUser.id);}catch{/* preserve the original failure */}
        }
        throw vendorError;
      }
      setShowForm(false);
      setForm({fullName:"",email:"",password:"",phone:"",businessName:""});
      await load();
      setMessage("Vendor login and vendor profile created successfully for this tenant.");
    }catch(e){
      setError(e.message||"Unable to create vendor account.");
    }finally{setSaving(false);}
  }

  return <div className="content">
    <div className="page-head">
      <div><p className="eyebrow">TENANT VENDOR MANAGEMENT</p><h1>Vendors</h1><p>Vendor profiles and accounts belonging to your authenticated tenant.</p></div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button className="secondary-btn" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button>
        <button className="primary-btn" onClick={()=>{setError("");setMessage("");setShowForm(true);}}><Plus size={16}/> Add Vendor</button>
      </div>
    </div>

    {error&&<div className="error-box" role="alert">{error}</div>}
    {message&&<div className="info-box" role="status">{message}</div>}

    {showForm&&<div className="panel" style={{marginBottom:22,padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h2 style={{margin:0}}>Create Vendor Account</h2><p style={{margin:"5px 0 0",color:"#75839a"}}>This creates a VENDOR login and a matching vendor profile in your tenant.</p></div>
        <button className="icon-btn" type="button" onClick={()=>setShowForm(false)}><X size={18}/></button>
      </div>
      <form className="auth-form" onSubmit={createVendor}>
        <label>Vendor Full Name<input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} minLength="2" required/></label>
        <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} autoComplete="email" required/></label>
        <label>Business Name<input value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})} required/></label>
        <label>Phone (optional)<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} inputMode="tel"/></label>
        <label>Temporary Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength="8" autoComplete="new-password" required/></label>
        <div style={{display:"flex",gap:10}}>
          <button type="button" className="secondary-btn" onClick={()=>setShowForm(false)} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-btn" disabled={saving}>{saving?"Creating...":"Create Vendor"}</button>
        </div>
      </form>
    </div>}

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
              <td>#{v.id}</td><td><b>{v.vendorName||"Unnamed vendor"}</b></td>
              <td>{v.businessName||"—"}</td><td>{v.email||"—"}</td>
              <td><span className={"badge "+(String(v.status||"").toUpperCase()==="ACTIVE"?"green":"orange")}>{v.status||"UNKNOWN"}</span></td>
            </tr>)}
            {!loading&&!error&&!filtered.length&&<tr><td colSpan="5" style={{textAlign:"center",padding:28}}><AlertCircle size={20}/> No vendors found for this tenant.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    <p style={{color:"#75839a",fontSize:13,marginTop:14}}><Package size={14} style={{verticalAlign:"middle"}}/> Vendor accounts are created through the authenticated tenant administrator workflow, not public self-registration.</p>
  </div>;
}
