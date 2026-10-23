import React,{useMemo,useState} from "react";
import {Link} from "react-router-dom";
import {
  Package,Users,Boxes,Truck,Settings,Search,Plus,RefreshCw,
  IndianRupee,AlertTriangle,CheckCircle2,Clock3,ArrowUpRight,
  Edit3,Trash2,Store,BarChart3,Save
} from "lucide-react";

const products=[
  {id:1,name:"Gaming Laptop",vendor:"Tech Store",price:65000,stock:4,status:"ACTIVE"},
  {id:2,name:"iPhone Flip",vendor:"Tech Store",price:0,stock:0,status:"ACTIVE"},
  {id:3,name:"Mechanical Keyboard",vendor:"Gear Hub",price:2500,stock:19,status:"ACTIVE"},
  {id:4,name:"Wireless Mouse",vendor:"Tech Store",price:1200,stock:40,status:"ACTIVE"},
  {id:5,name:"Gaming Monitor",vendor:"Gear Hub",price:18000,stock:12,status:"ACTIVE"}
];

const vendors=[
  {id:1,name:"Krishna",email:"krishna@gmail.com",business:"Tech Store",products:2,orders:8,status:"ACTIVE"},
  {id:2,name:"Ravi Kumar",email:"ravi@gearhub.com",business:"Gear Hub",products:14,orders:21,status:"ACTIVE"},
  {id:3,name:"Suresh",email:"suresh@smartworld.com",business:"Smart World",products:9,orders:17,status:"ACTIVE"}
];

const orders=[
  {id:8,customer:10,vendor:"Tech Store",status:"PLACED",total:65000},
  {id:7,customer:10,vendor:"Tech Store",status:"PLACED",total:65000},
  {id:6,customer:10,vendor:"Tech Store + Gear Hub",status:"PLACED",total:67500},
  {id:5,customer:1,vendor:"Tech Store",status:"CONFIRMED",total:65000},
  {id:4,customer:1,vendor:"Tech Store + Gear Hub",status:"PLACED",total:67500}
];

export default function TenantManagement({type="products"}){
  if(type==="vendors")return <TenantVendors/>;
  if(type==="inventory")return <TenantInventory/>;
  if(type==="orders")return <TenantOrders/>;
  if(type==="settings")return <TenantSettings/>;

  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [items,setItems]=useState(products);

  const filtered=items.filter(p=>
    `${p.name} ${p.vendor}`.toLowerCase().includes(search.toLowerCase())
  );

  const stock=items.reduce((s,p)=>s+Number(p.stock),0);
  const low=items.filter(p=>p.stock<=5).length;

  return <Page>
    <Header
      eyebrow="PRODUCT MANAGEMENT"
      title="Products"
      desc="Manage products belonging to your tenant."
      action={<button style={primary} onClick={()=>setShowAdd(true)}><Plus size={17}/> Add Product</button>}
    />

    <div style={stats}>
      <Stat icon={<Package/>} title="Total Products" value={items.length} note="Tenant catalogue"/>
      <Stat icon={<Boxes/>} title="Total Stock" value={stock} note="Units available"/>
      <Stat icon={<AlertTriangle/>} title="Low Stock" value={low} note="Need attention"/>
      <Stat icon={<IndianRupee/>} title="Catalogue Value" value={"₹"+items.reduce((s,p)=>s+p.price*p.stock,0).toLocaleString("en-IN")} note="Current stock value"/>
    </div>

    {showAdd&&<div style={formCard}>
      <div style={formHead}>
        <div><h2>Add Product</h2><p>Create a product for your tenant.</p></div>
        <button style={close} onClick={()=>setShowAdd(false)}>×</button>
      </div>
      <div style={formGrid}>
        <input style={input} placeholder="Product name"/>
        <input style={input} placeholder="Price"/>
        <input style={input} placeholder="Stock quantity"/>
        <select style={input}><option>ACTIVE</option><option>INACTIVE</option></select>
      </div>
      <button style={primary} onClick={()=>setShowAdd(false)}><Save size={16}/> Save Product</button>
    </div>}

    <div style={toolbar}>
      <div style={searchBox}><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products or vendors..."/></div>
      <button style={secondary}><RefreshCw size={16}/> Refresh</button>
    </div>

    <div style={tableCard}>
      <div style={tableHead}>
        <div><h2>Product Catalogue</h2><p>{filtered.length} products in your tenant</p></div>
      </div>
      <table style={table}>
        <thead><tr><th>PRODUCT</th><th>VENDOR</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
        <tbody>{filtered.map(p=><tr key={p.id}>
          <td><div style={itemCell}><div style={iconBox}><Package size={18}/></div><div><strong>{p.name}</strong><small>Product #{p.id}</small></div></div></td>
          <td>{p.vendor}</td>
          <td><strong>₹{p.price.toLocaleString("en-IN")}</strong></td>
          <td><b style={{color:p.stock<=5?"#d34d4d":"#25334a"}}>{p.stock}</b></td>
          <td><Status text={p.status}/></td>
          <td><div style={{display:"flex",gap:6}}><button style={iconBtn}><Edit3 size={15}/></button><button style={iconBtn}><Trash2 size={15}/></button></div></td>
        </tr>)}</tbody>
      </table>
    </div>
  </Page>;
}

function TenantVendors(){
  return <Page>
    <Header eyebrow="VENDOR MANAGEMENT" title="Vendors" desc="Manage vendors registered under your tenant." action={<button style={primary}><Plus size={17}/> Add Vendor</button>}/>
    <div style={stats}>
      <Stat icon={<Users/>} title="Total Vendors" value={vendors.length} note="Registered sellers"/>
      <Stat icon={<CheckCircle2/>} title="Active" value={3} note="Currently active"/>
      <Stat icon={<Package/>} title="Products" value="25" note="Vendor products"/>
      <Stat icon={<Truck/>} title="Orders" value="46" note="Vendor orders"/>
    </div>
    <div style={grid3}>{vendors.map(v=><div style={vendorCard} key={v.id}>
      <div style={vendorTop}><div style={avatar}>{v.name.charAt(0)}</div><Status text={v.status}/></div>
      <h2>{v.name}</h2><p>{v.business}</p>
      <small>{v.email}</small>
      <div style={vendorStats}><span><b>{v.products}</b> Products</span><span><b>{v.orders}</b> Orders</span></div>
      <button style={secondaryWide}>View Vendor <ArrowUpRight size={15}/></button>
    </div>)}</div>
  </Page>;
}

function TenantInventory(){
  const [stock,setStock]=useState(products.map(p=>({...p})));
  return <Page>
    <Header eyebrow="INVENTORY MANAGEMENT" title="Inventory" desc="Monitor and maintain stock across your tenant." action={<button style={secondary}><RefreshCw size={16}/> Refresh</button>}/>
    <div style={stats}>
      <Stat icon={<Boxes/>} title="Total Units" value={stock.reduce((s,p)=>s+p.stock,0)} note="Available inventory"/>
      <Stat icon={<CheckCircle2/>} title="Healthy Stock" value={stock.filter(p=>p.stock>5).length} note="Products"/>
      <Stat icon={<AlertTriangle/>} title="Low Stock" value={stock.filter(p=>p.stock>0&&p.stock<=5).length} note="Below threshold"/>
      <Stat icon={<Truck/>} title="Out of Stock" value={stock.filter(p=>p.stock===0).length} note="Needs restocking"/>
    </div>
    <div style={tableCard}>
      <div style={tableHead}><h2>Stock Overview</h2><p>Update inventory quantities for tenant products.</p></div>
      <table style={table}><thead><tr><th>PRODUCT</th><th>VENDOR</th><th>STOCK LEVEL</th><th>STATUS</th><th>UPDATE</th></tr></thead>
      <tbody>{stock.map(p=><tr key={p.id}>
        <td><strong>{p.name}</strong><small>Product #{p.id}</small></td>
        <td>{p.vendor}</td>
        <td><div style={{display:"flex",alignItems:"center",gap:12}}><div style={progress}><div style={{...progressFill,width:`${Math.min(p.stock,40)/40*100}%`}}/></div><b>{p.stock}</b></div></td>
        <td><Status text={p.stock===0?"OUT OF STOCK":p.stock<=5?"LOW STOCK":"HEALTHY"}/></td>
        <td><input style={smallInput} type="number" min="0" value={p.stock} onChange={e=>setStock(stock.map(x=>x.id===p.id?{...x,stock:Number(e.target.value)}:x))}/></td>
      </tr>)}</tbody></table>
    </div>
  </Page>;
}

function TenantOrders(){
  return <Page>
    <Header eyebrow="ORDER MANAGEMENT" title="Orders" desc="Review orders placed within your tenant." action={<button style={secondary}><RefreshCw size={16}/> Refresh</button>}/>
    <div style={stats}>
      <Stat icon={<Truck/>} title="Total Orders" value={orders.length} note="Tenant orders"/>
      <Stat icon={<Clock3/>} title="Pending" value={3} note="Need attention"/>
      <Stat icon={<CheckCircle2/>} title="Confirmed" value={1} note="Confirmed orders"/>
      <Stat icon={<IndianRupee/>} title="Order Value" value="₹3,39,500" note="Total value"/>
    </div>
    <div style={tableCard}>
      <div style={tableHead}><h2>Tenant Orders</h2><p>Latest orders from your marketplace.</p></div>
      <table style={table}><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>VENDOR</th><th>STATUS</th><th>TOTAL</th><th></th></tr></thead>
      <tbody>{orders.map(o=><tr key={o.id}><td><strong>Order #{o.id}</strong></td><td>Customer #{o.customer}</td><td>{o.vendor}</td><td><Status text={o.status}/></td><td><strong>₹{o.total.toLocaleString("en-IN")}</strong></td><td><button style={secondarySmall}>View <ArrowUpRight size={14}/></button></td></tr>)}</tbody></table>
    </div>
  </Page>;
}

function TenantSettings(){
  const [saved,setSaved]=useState(false);
  return <Page>
    <Header eyebrow="TENANT CONFIGURATION" title="Store Settings" desc="Manage your tenant store configuration."/>
    <div style={settingsGrid}>
      <div style={settingsCard}><Store size={25} color="#2864e6"/><h2>Store Profile</h2><p>Basic information about your marketplace.</p>
        <label>Store Name<input style={input} defaultValue="MarketGrid Tenant #1"/></label>
        <label>Store Email<input style={input} defaultValue="admin@test.com"/></label>
        <label>Support Phone<input style={input} defaultValue="+91 98765 43210"/></label>
      </div>
      <div style={settingsCard}><Settings size={25} color="#2864e6"/><h2>Tenant Security</h2><p>Security controls for your tenant.</p>
        <Toggle text="JWT Authentication" active/><Toggle text="Tenant Data Isolation" active/><Toggle text="Vendor Access Control" active/><Toggle text="Order Isolation" active/>
      </div>
    </div>
    <button style={{...primary,marginTop:20}} onClick={()=>setSaved(true)}>{saved?<><CheckCircle2 size={16}/> Saved</>:<><Save size={16}/> Save Changes</>}</button>
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