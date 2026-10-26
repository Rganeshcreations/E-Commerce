import React,{useEffect,useMemo,useState} from "react";
import {Link} from "react-router-dom";
import {
  Package,Boxes,Truck,Settings,Search,Plus,RefreshCw,
  IndianRupee,AlertTriangle,CheckCircle2,Clock3,Trash2,Store,Save
} from "lucide-react";
import {api} from "../services/api";

export default function TenantManagement({type="products"}){
  if(type==="inventory")return <TenantInventory/>;
  if(type==="orders")return <TenantOrders/>;
  if(type==="settings")return <TenantSettings/>;
  return <TenantProducts/>;
}

function useTenantCatalog(){
  const [items,setItems]=useState([]);
  const [vendors,setVendors]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=async()=>{
    setLoading(true);
    setError("");
    try{
      const [productData,vendorData]=await Promise.all([api.products(),api.vendors()]);
      const vendorList=Array.isArray(vendorData)?vendorData:[];
      const names=new Map(vendorList.map(v=>[Number(v.id),v.businessName||v.vendorName||("Vendor #"+v.id)]));
      setVendors(vendorList);
      setItems((Array.isArray(productData)?productData:[]).map(p=>({
        ...p,
        name:p.productName||("Product #"+p.id),
        vendor:names.get(Number(p.vendorId))||("Vendor #"+p.vendorId),
        stock:Number(p.stockQuantity??0),
        price:Number(p.price||0)
      })));
    }catch(e){
      setError(e.message||"Unable to load tenant catalogue.");
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{load();},[]);
  return {items,setItems,vendors,loading,error,load,setError};
}

function TenantProducts(){
  const {items, vendors, loading, error, load, setError}=useTenantCatalog();
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({productName:"",description:"",vendorId:"",price:"",stockQuantity:""});
  const filtered=useMemo(()=>items.filter(p=>(p.name+" "+p.vendor).toLowerCase().includes(search.toLowerCase())),[items,search]);
  const stock=items.reduce((sum,p)=>sum+Number(p.stock||0),0);
  const low=items.filter(p=>Number(p.stock||0)<=5).length;

  async function saveProduct(event){
    event.preventDefault();
    setError("");
    const price=Number(form.price), quantity=Number(form.stockQuantity);
    if(!form.productName.trim()||!form.vendorId||!Number.isFinite(price)||price<0||!Number.isInteger(quantity)||quantity<0){
      setError("Enter a product name, select a vendor, and provide a valid price and whole-number stock quantity.");
      return;
    }
    try{
      setSaving(true);
      await api.createProduct({
        productName:form.productName.trim(),
        description:form.description.trim(),
        vendorId:Number(form.vendorId),
        price,
        stockQuantity:quantity,
        status:"ACTIVE"
      });
      setShowAdd(false);
      setForm({productName:"",description:"",vendorId:"",price:"",stockQuantity:""});
      await load();
    }catch(e){setError(e.message||"Unable to create product.");}
    finally{setSaving(false);}
  }

  async function removeProduct(product){
    if(!window.confirm("Delete "+product.name+"?"))return;
    try{setError("");await api.deleteProduct(product.id);await load();}
    catch(e){setError(e.message||"Unable to delete product.");}
  }

  return <Page>
    <Header eyebrow="PRODUCT MANAGEMENT" title="Products" desc="Manage products belonging to your tenant." action={<button style={primary} onClick={()=>setShowAdd(true)}><Plus size={17}/> Add Product</button>}/>
    {error&&<div role="alert" style={{...tableCard,padding:14,marginBottom:18,color:"#b42318"}}>{error}</div>}
    <div style={stats}>
      <Stat icon={<Package/>} title="Total Products" value={loading?"—":items.length} note="Live tenant catalogue"/>
      <Stat icon={<Boxes/>} title="Total Stock" value={loading?"—":stock} note="Units available"/>
      <Stat icon={<AlertTriangle/>} title="Low Stock" value={loading?"—":low} note="At or below 5 units"/>
      <Stat icon={<IndianRupee/>} title="Catalogue Value" value={loading?"—":"₹"+items.reduce((sum,p)=>sum+p.price*p.stock,0).toLocaleString("en-IN")} note="Current stock value"/>
    </div>
    {showAdd&&<form onSubmit={saveProduct} style={formCard}>
      <div style={formHead}><div><h2>Add Product</h2><p>Create a product for this tenant.</p></div><button type="button" style={close} onClick={()=>setShowAdd(false)}>×</button></div>
      <div style={formGrid}>
        <input style={input} value={form.productName} onChange={e=>setForm({...form,productName:e.target.value})} placeholder="Product name" required/>
        <input style={input} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description"/>
        <select style={input} value={form.vendorId} onChange={e=>setForm({...form,vendorId:e.target.value})} required>
          <option value="">Select vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.businessName||v.vendorName} (#{v.id})</option>)}
        </select>
        <input style={input} type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="Price" required/>
        <input style={input} type="number" min="0" step="1" value={form.stockQuantity} onChange={e=>setForm({...form,stockQuantity:e.target.value})} placeholder="Stock quantity" required/>
      </div>
      <button style={primary} disabled={saving||vendors.length===0}><Save size={16}/>{saving?"Saving...":"Save Product"}</button>
      {!vendors.length&&<p>No vendors are available in this tenant. Create/approve a vendor first.</p>}
    </form>}
    <div style={toolbar}><div style={searchBox}><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products or vendors..."/></div><button style={secondary} onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    <div style={tableCard}><div style={tableHead}><h2>Product Catalogue</h2><p>{loading?"Loading...":filtered.length+" live products in your tenant"}</p></div>
      <div style={{overflowX:"auto"}}><table style={table}><thead><tr><th>PRODUCT</th><th>VENDOR</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
        <tbody>
          {loading&&<tr><td colSpan="6" style={{padding:25,textAlign:"center"}}>Loading products...</td></tr>}
          {!loading&&filtered.map(p=><tr key={p.id}><td><div style={itemCell}><div style={iconBox}><Package size={18}/></div><div><strong>{p.name}</strong><small>Product #{p.id}</small></div></div></td><td>{p.vendor}</td><td><strong>{"₹"+p.price.toLocaleString("en-IN")}</strong></td><td><b style={{color:p.stock<=5?"#d34d4d":"#25334a"}}>{p.stock}</b></td><td><Status text={p.status||"ACTIVE"}/></td><td><button style={iconBtn} onClick={()=>removeProduct(p)} title="Delete product"><Trash2 size={15}/></button></td></tr>)}
          {!loading&&!error&&!filtered.length&&<tr><td colSpan="6" style={{padding:25,textAlign:"center"}}>No products found.</td></tr>}
        </tbody>
      </table></div>
    </div>
  </Page>;
}

function TenantInventory(){
  const {items,setItems,loading,error,load,setError}=useTenantCatalog();
  const [saving,setSaving]=useState(null);
  const healthy=items.filter(p=>p.stock>5).length;
  const low=items.filter(p=>p.stock>0&&p.stock<=5).length;
  const empty=items.filter(p=>p.stock===0).length;

  async function saveStock(product){
    try{
      setSaving(product.id);setError("");
      await api.updateProduct(product.id,{
        productName:product.productName,
        description:product.description,
        price:Number(product.price),
        stockQuantity:Number(product.stock),
        status:product.status||"ACTIVE"
      });
      await load();
    }catch(e){setError(e.message||"Unable to update stock.");}
    finally{setSaving(null);}
  }

  return <Page>
    <Header eyebrow="INVENTORY MANAGEMENT" title="Inventory" desc="Monitor and maintain stock across your tenant." action={<button style={secondary} onClick={load}><RefreshCw size={16}/> Refresh</button>}/>
    {error&&<div role="alert" style={{...tableCard,padding:14,marginBottom:18,color:"#b42318"}}>{error}</div>}
    <div style={stats}>
      <Stat icon={<Boxes/>} title="Total Units" value={loading?"—":items.reduce((sum,p)=>sum+p.stock,0)} note="Available inventory"/>
      <Stat icon={<CheckCircle2/>} title="Healthy Stock" value={loading?"—":healthy} note="Products above 5 units"/>
      <Stat icon={<AlertTriangle/>} title="Low Stock" value={loading?"—":low} note="Below threshold"/>
      <Stat icon={<Truck/>} title="Out of Stock" value={loading?"—":empty} note="Needs restocking"/>
    </div>
    <div style={tableCard}><div style={tableHead}><h2>Stock Overview</h2><p>Updates are saved to the Product Service.</p></div>
      <div style={{overflowX:"auto"}}><table style={table}><thead><tr><th>PRODUCT</th><th>VENDOR</th><th>STOCK LEVEL</th><th>STATUS</th><th>UPDATE</th><th></th></tr></thead>
      <tbody>
        {loading&&<tr><td colSpan="6" style={{padding:25,textAlign:"center"}}>Loading inventory...</td></tr>}
        {!loading&&items.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>Product #{p.id}</small></td><td>{p.vendor}</td><td><b>{p.stock}</b></td><td><Status text={p.stock===0?"OUT OF STOCK":p.stock<=5?"LOW STOCK":"HEALTHY"}/></td><td><input style={smallInput} type="number" min="0" step="1" value={p.stock} onChange={e=>setItems(items.map(x=>x.id===p.id?{...x,stock:Number(e.target.value)}:x))}/></td><td><button style={secondarySmall} disabled={saving===p.id} onClick={()=>saveStock(p)}><Save size={14}/>{saving===p.id?"Saving":"Save"}</button></td></tr>)}
      </tbody></table></div>
    </div>
  </Page>;
}

function TenantOrders(){
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let active=true;
    async function load(){
      setLoading(true);setError("");
      try{const data=await api.orders();if(active)setOrders(Array.isArray(data)?data:[]);}
      catch(e){if(active)setError(e.message||"Unable to load tenant orders.");}
      finally{if(active)setLoading(false);}
    }
    load();return()=>{active=false;};
  },[refresh]);
  const total=orders.reduce((sum,o)=>sum+Number(o.totalAmount||0),0);
  const pending=orders.filter(o=>["PLACED","PENDING"].includes(String(o.status||"").toUpperCase())).length;
  const confirmed=orders.filter(o=>String(o.status||"").toUpperCase()==="CONFIRMED").length;

  return <Page>
    <Header eyebrow="ORDER MANAGEMENT" title="Orders" desc="Review orders placed within your tenant." action={<button style={secondary} onClick={()=>setRefresh(v=>v+1)}><RefreshCw size={16}/> Refresh</button>}/>
    {error&&<div role="alert" style={{...tableCard,padding:14,marginBottom:18,color:"#b42318"}}>{error}</div>}
    <div style={stats}>
      <Stat icon={<Truck/>} title="Total Orders" value={loading?"—":orders.length} note="Live tenant orders"/>
      <Stat icon={<Clock3/>} title="Pending" value={loading?"—":pending} note="Need attention"/>
      <Stat icon={<CheckCircle2/>} title="Confirmed" value={loading?"—":confirmed} note="Confirmed orders"/>
      <Stat icon={<IndianRupee/>} title="Order Value" value={loading?"—":"₹"+total.toLocaleString("en-IN")} note="Returned order value"/>
    </div>
    <div style={tableCard}><div style={tableHead}><h2>Tenant Orders</h2><p>Latest orders from your marketplace.</p></div>
      <div style={{overflowX:"auto"}}><table style={table}><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>STATUS</th><th>TOTAL</th><th></th></tr></thead>
      <tbody>
        {loading&&<tr><td colSpan="6" style={{padding:25,textAlign:"center"}}>Loading orders...</td></tr>}
        {!loading&&orders.map(o=><tr key={o.id}><td><strong>{"Order #"+o.id}</strong></td><td>{"Customer #"+o.customerId}</td><td>{(o.items||[]).length}</td><td><Status text={o.status||"UNKNOWN"}/></td><td><strong>{"₹"+Number(o.totalAmount||0).toLocaleString("en-IN")}</strong></td><td><Link style={secondarySmall} to={"/orders/"+o.id}>View <Truck size={14}/></Link></td></tr>)}
        {!loading&&!error&&!orders.length&&<tr><td colSpan="6" style={{padding:25,textAlign:"center"}}>No orders returned by the API.</td></tr>}
      </tbody></table></div>
    </div>
  </Page>;
}

function TenantSettings(){
  const tenantId=localStorage.getItem("marketgrid_tenant")||"unknown";
  return <Page>
    <Header eyebrow="TENANT CONFIGURATION" title="Store Settings" desc="Tenant configuration overview."/>
    <div style={settingsGrid}>
      <div style={settingsCard}><Store size={25} color="#2864e6"/><h2>Store Profile</h2><p>Store identity resolved from your authenticated session.</p><label>Tenant ID<input style={input} value={tenantId} readOnly/></label><label>Store Slug<input style={input} value="Managed in Tenant Service" readOnly/></label></div>
      <div style={settingsCard}><Settings size={25} color="#2864e6"/><h2>Tenant Security</h2><p>Security is enforced by backend JWT and tenant-aware APIs.</p><div style={{padding:"12px 0"}}><Status text="JWT AUTHENTICATION"/></div><div style={{padding:"12px 0"}}><Status text="TENANT DATA ISOLATION"/></div><p style={{color:"#75839a",fontSize:13}}>Store profile editing is not available yet because no tenant settings update endpoint exists. No unsaved changes are represented as saved.</p></div>
    </div>
  </Page>;
}

function Page({children}){return <div style={page}>{children}</div>}

function Header({eyebrow,title,desc,action}){return <div style={header}><div><div style={eyebrowStyle}>{eyebrow}</div><h1 style={h1}>{title}</h1><p style={descStyle}>{desc}</p></div>{action}</div>}

function Stat({icon,title,value,note}){return <div style={stat}><div style={statIcon}>{icon}</div><span>{title}</span><strong>{value}</strong><small>{note}</small></div>}

function Status({text}){let good=["ACTIVE","HEALTHY","CONFIRMED"].includes(text);return <span style={{...status,background:good?"#eaf8f0":"#fff2df",color:good?"#17814b":"#a56b00"}}><CheckCircle2 size={12}/>{text}</span>}

function Toggle({text,active}){return <div style={toggle}><span>{text}</span><div style={{width:40,height:22,borderRadius:20,background:active?"#2864e6":"#ccd4df",position:"relative"}}><i style={{position:"absolute",width:16,height:16,borderRadius:"50%",background:"#fff",top:3,left:active?21:3}}/></div></div>}

const page={minHeight:"100%",background:"#f5f7fb",padding:"36px 42px"};
const header={display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:20,marginBottom:28,flexWrap:"wrap"};
const eyebrowStyle={color:"#2864e6",fontSize:12,fontWeight:800,letterSpacing:"2.5px",marginBottom:8};
const h1={margin:"0 0 7px",fontSize:38,fontWeight:800,color:"#17233c"};
const descStyle={margin:0,color:"#75839a",fontSize:15};
const stats={display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:18,marginBottom:22};
const stat={background:"#fff",border:"1px solid #e2e7ef",borderRadius:15,padding:19,boxShadow:"0 3px 12px rgba(30,45,75,.04)"};
const statIcon={width:42,height:42,borderRadius:11,background:"#edf4ff",color:"#2864e6",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12};
const toolbar={display:"flex",gap:10,marginBottom:18};
const searchBox={flex:1,display:"flex",alignItems:"center",gap:9,background:"#fff",border:"1px solid #dfe5ee",borderRadius:10,padding:"0 13px",height:43};
const input={width:"100%",padding:"11px 12px",border:"1px solid #dce3ec",borderRadius:9,outline:"none",marginTop:7,marginBottom:14};
const primary={display:"inline-flex",alignItems:"center",gap:7,border:0,borderRadius:10,background:"#2864e6",color:"#fff",padding:"11px 17px",fontWeight:800,cursor:"pointer"};
const secondary={display:"inline-flex",alignItems:"center",gap:7,border:"1px solid #dce3ee",borderRadius:10,background:"#fff",padding:"10px 15px",fontWeight:700,cursor:"pointer"};
const tableCard={background:"#fff",border:"1px solid #e2e7ef",borderRadius:16,overflow:"hidden",boxShadow:"0 3px 12px rgba(30,45,75,.04)"};
const tableHead={padding:"19px 22px",borderBottom:"1px solid #edf0f5"};
const table={width:"100%",borderCollapse:"collapse"};
const iconBox={width:40,height:40,borderRadius:10,background:"#edf4ff",color:"#2864e6",display:"flex",alignItems:"center",justifyContent:"center"};
const itemCell={display:"flex",alignItems:"center",gap:12};
const status={display:"inline-flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:20,fontSize:10,fontWeight:800};
const iconBtn={border:"1px solid #e1e6ee",background:"#fff",borderRadius:8,padding:7,color:"#64738a",cursor:"pointer"};
const formCard={background:"#fff",border:"1px solid #dfe5ee",borderRadius:16,padding:22,marginBottom:20};
const formHead={display:"flex",justifyContent:"space-between"};
const formGrid={display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12};
const close={border:0,background:"transparent",fontSize:25,cursor:"pointer"};
const grid3={display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18};
const vendorCard={background:"#fff",border:"1px solid #e2e7ef",borderRadius:16,padding:20,boxShadow:"0 3px 12px rgba(30,45,75,.04)"};
const vendorTop={display:"flex",justifyContent:"space-between",alignItems:"center"};
const avatar={width:48,height:48,borderRadius:13,background:"#2864e6",color:"#fff",display:"grid",placeItems:"center",fontSize:20,fontWeight:800};
const vendorStats={display:"flex",gap:30,borderTop:"1px solid #edf0f5",borderBottom:"1px solid #edf0f5",padding:"14px 0",margin:"16px 0"};
const secondaryWide={width:"100%",padding:10,border:"1px solid #dce3ee",borderRadius:9,background:"#fff",fontWeight:700};
const progress={width:120,height:7,background:"#edf0f5",borderRadius:10,overflow:"hidden"};
const progressFill={height:"100%",background:"#2864e6",borderRadius:10};
const smallInput={width:80,padding:"8px",border:"1px solid #dce3ee",borderRadius:8};
const secondarySmall={display:"inline-flex",alignItems:"center",gap:5,border:"1px solid #dce3ee",background:"#fff",borderRadius:8,padding:"7px 10px"};
const settingsGrid={display:"grid",gridTemplateColumns:"1fr 1fr",gap:20};
const settingsCard={background:"#fff",border:"1px solid #e2e7ef",borderRadius:16,padding:24};
const toggle={display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid #edf0f5",fontWeight:600,color:"#344159"};