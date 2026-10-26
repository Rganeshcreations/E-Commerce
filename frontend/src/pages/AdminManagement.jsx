import React,{useEffect,useState} from "react";
import { api } from "../services/api";
import {
  Store,Users,Package,Truck,BarChart3,Settings,
  Search,Plus,RefreshCw,MoreHorizontal,ArrowUpRight,
  CheckCircle2,Clock3,Activity,ShieldCheck,Globe,
  TrendingUp,IndianRupee
} from "lucide-react";

export default function AdminManagement({type="tenants"}){
  const [search,setSearch]=useState("");
  const [refresh,setRefresh]=useState(0);
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    let active=true;
    async function loadRows(){
      if(["orders","analytics","settings"].includes(type)){
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try{
        let data=[];
        if(type==="tenants"){
          data=await api.tenants();
          data=(Array.isArray(data)?data:[]).map(t=>({
            id:t.id,name:t.name,owner:"—",email:t.ownerEmail||"—",
            vendors:"—",products:"—",status:t.active?"ACTIVE":"INACTIVE",slug:t.slug
          }));
        }else if(type==="users"){
          data=await api.users();
          data=(Array.isArray(data)?data:[]).map(u=>({
            id:u.id,name:u.fullName,email:u.email,role:u.role,
            tenant:u.tenantId,status:u.active?"ACTIVE":"INACTIVE"
          }));
        }else if(type==="vendors"){
          data=await api.vendors();
          data=(Array.isArray(data)?data:[]).map(v=>({
            id:v.id,name:v.vendorName,business:v.businessName,email:v.email,
            products:"—",orders:"—",status:v.status||"ACTIVE",tenantId:v.tenantId
          }));
        }else if(type==="products"){
          data=await api.products();
          data=(Array.isArray(data)?data:[]).map(p=>({
            id:p.id,name:p.productName,vendor:`Vendor #${p.vendorId}`,
            price:p.price,stock:p.stockQuantity,status:p.status||"ACTIVE"
          }));
        }
        if(active)setRows(data);
      }catch(e){
        if(active){setRows([]);setError(e.message||"Unable to load records from the backend.");}
      }finally{
        if(active)setLoading(false);
      }
    }
    loadRows();
    return ()=>{active=false;};
  },[type,refresh]);

  const config={
    tenants:{eyebrow:"TENANT MANAGEMENT",title:"Tenants",desc:"Manage independent stores across the MarketGrid platform.",icon:Store,add:"Add Tenant"},
    users:{eyebrow:"USER MANAGEMENT",title:"Users",desc:"Manage platform users, roles and access.",icon:Users,add:"Add User"},
    vendors:{eyebrow:"VENDOR MANAGEMENT",title:"Vendors",desc:"Monitor and manage vendors across all tenants.",icon:Users,add:"Add Vendor"},
    products:{eyebrow:"PRODUCT MANAGEMENT",title:"Products",desc:"Monitor products listed across the marketplace.",icon:Package,add:"Add Product"}
  };

  if(type==="orders") return <AdminOrders/>;

  if(type==="analytics") return <AdminAnalytics/>;

  if(type==="settings") return <AdminSettings/>;

  const c=config[type];
  const Icon=c.icon;
  const filteredRows=rows.filter(x=>
    JSON.stringify(x).toLowerCase().includes(search.toLowerCase())
  );

  return(
    <div style={page}>
      <Header eyebrow={c.eyebrow} title={c.title} desc={c.desc}/>

      <div style={statsGrid}>
        <Stat icon={<Icon size={21}/>} title={`Total ${c.title}`} value={loading?"—":rows.length}/>
        <Stat icon={<CheckCircle2 size={21}/>} title="Active" value={loading?"—":rows.filter(x=>x.status==="ACTIVE").length}/>
        <Stat icon={<Clock3 size={21}/>} title="Pending" value={loading?"—":rows.filter(x=>x.status==="PENDING").length}/>
        <Stat icon={<Activity size={21}/>} title="Platform Status" value="Healthy"/>
      </div>

      {error && <div role="alert" style={{...tableCard,padding:"14px",marginBottom:"16px",color:"#b42318"}}>{error}</div>}

      <div style={toolbar}>
        <div style={searchBox}>
          <Search size={18}/>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder={`Search ${c.title.toLowerCase()}...`}
          />
        </div>

        <button style={secondary} onClick={()=>setRefresh(value=>value+1)}>
          <RefreshCw size={16}/> Refresh
        </button>

        <button style={primary}>
          <Plus size={17}/> {c.add}
        </button>
      </div>

      <div style={tableCard}>
        <div style={tableHead}>
          <div>
            <h2>{c.title} Directory</h2>
            <p>{loading?"Loading records...":`${filteredRows.length} records found`}</p>
          </div>
          <MoreHorizontal size={20} color="#8b98ac"/>
        </div>

        <div style={{overflowX:"auto"}}>
          <table style={table}>
            <thead>
              <tr>
                {type==="tenants"&&<><th>ID</th><th>STORE</th><th>OWNER</th><th>VENDORS</th><th>PRODUCTS</th><th>STATUS</th><th></th></>}
                {type==="users"&&<><th>ID</th><th>USER</th><th>ROLE</th><th>TENANT</th><th>STATUS</th><th></th></>}
                {type==="vendors"&&<><th>ID</th><th>VENDOR</th><th>BUSINESS</th><th>PRODUCTS</th><th>ORDERS</th><th>STATUS</th><th></th></>}
                {type==="products"&&<><th>ID</th><th>PRODUCT</th><th>VENDOR</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th></th></>}
              </tr>
            </thead>

            <tbody>
              {loading && <tr><td colSpan="7" style={{textAlign:"center",padding:"28px"}}>Loading records from the server...</td></tr>}
            {!loading && filteredRows.map(x=>(
                <tr key={x.id}>
                  <td>#{x.id}</td>

                  {type==="tenants"&&<>
                    <td><strong>{x.name}</strong><small>{x.email}</small></td>
                    <td>{x.owner}</td>
                    <td>{x.vendors}</td>
                    <td>{x.products}</td>
                  </>}

                  {type==="users"&&<>
                    <td><strong>{x.name}</strong><small>{x.email}</small></td>
                    <td><Role role={x.role}/></td>
                    <td>{x.tenant}</td>
                  </>}

                  {type==="vendors"&&<>
                    <td><strong>{x.name}</strong><small>{x.email}</small></td>
                    <td>{x.business}</td>
                    <td>{x.products}</td>
                    <td>{x.orders}</td>
                  </>}

                  {type==="products"&&<>
                    <td><strong>{x.name}</strong></td>
                    <td>{x.vendor}</td>
                    <td>₹{Number(x.price).toLocaleString("en-IN")}</td>
                    <td>
                      <span style={{
                        color:x.stock<=5?"#d45151":"#25334a",
                        fontWeight:800
                      }}>
                        {x.stock}
                      </span>
                    </td>
                  </>}

                  <td><Status status={x.status}/></td>
                  <td><button style={more}><MoreHorizontal size={17}/></button></td>
                </tr>
              ))}
              {!loading && !error && filteredRows.length===0 && <tr><td colSpan="7" style={{textAlign:"center",padding:"28px"}}>No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminOrders(){
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    let active=true;
    async function load(){
      setLoading(true);
      setError("");
      try{
        const data=await api.orders();
        if(active)setOrders(Array.isArray(data)?data:[]);
      }catch(e){
        if(active){setOrders([]);setError(e.message||"Unable to load orders.");}
      }finally{
        if(active)setLoading(false);
      }
    }
    load();
    return ()=>{active=false;};
  },[refresh]);

  const totalValue=orders.reduce((sum,o)=>sum+Number(o.totalAmount||0),0);
  const pending=orders.filter(o=>["PLACED","PENDING","CONFIRMED"].includes(String(o.status||"").toUpperCase())).length;
  const completed=orders.filter(o=>String(o.status||"").toUpperCase()==="DELIVERED").length;
  const recent=[...orders].sort((a,b)=>Number(b.id)-Number(a.id));

  return(
    <div style={page}>
      <Header eyebrow="ORDER MANAGEMENT" title="Orders" desc="Monitor orders visible to your platform administrator account."/>
      {error&&<div role="alert" style={{...tableCard,padding:14,marginBottom:18,color:"#b42318"}}>{error}</div>}
      <div style={statsGrid}>
        <Stat icon={<Truck size={21}/>} title="Total Orders" value={loading?"—":orders.length}/>
        <Stat icon={<Clock3 size={21}/>} title="Pending" value={loading?"—":pending}/>
        <Stat icon={<CheckCircle2 size={21}/>} title="Delivered" value={loading?"—":completed}/>
        <Stat icon={<IndianRupee size={21}/>} title="Order Value" value={loading?"—":"₹"+totalValue.toLocaleString("en-IN")}/>
      </div>
      <div style={toolbar}>
        <span style={{color:"#75839a"}}>{loading?"Loading orders...":orders.length+" orders returned by the API"}</span>
        <button style={secondary} onClick={()=>setRefresh(value=>value+1)}><RefreshCw size={16}/> Refresh</button>
      </div>
      <div style={tableCard}>
        <div style={tableHead}><div><h2>Marketplace Orders</h2><p>Live order records</p></div></div>
        <div style={{overflowX:"auto"}}>
          <table style={table}>
            <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>VENDOR(S)</th><th>STATUS</th><th>TOTAL</th></tr></thead>
            <tbody>
              {loading&&<tr><td colSpan="5" style={{padding:28,textAlign:"center"}}>Loading orders...</td></tr>}
              {!loading&&recent.map(order=>{
                const vendors=[...new Set((order.items||[]).map(item=>item.vendorId).filter(id=>id!=null))];
                return <tr key={order.id}>
                  <td><strong>{"Order #"+order.id}</strong></td>
                  <td>{"Customer #"+order.customerId}</td>
                  <td>{vendors.length?vendors.map(id=>"Vendor #"+id).join(", "):"—"}</td>
                  <td><Status status={order.status||"UNKNOWN"}/></td>
                  <td><strong>{"₹"+Number(order.totalAmount||0).toLocaleString("en-IN")}</strong></td>
                </tr>;
              })}
              {!loading&&!error&&orders.length===0&&<tr><td colSpan="5" style={{padding:28,textAlign:"center"}}>No orders returned by the API.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminAnalytics(){
  return(
    <div style={page}>
      <Header eyebrow="PLATFORM ANALYTICS" title="Analytics" desc="Monitor MarketGrid marketplace performance."/>

      <div style={statsGrid}>
        <Stat icon={<TrendingUp size={21}/>} title="GMV" value="₹8.4Cr"/>
        <Stat icon={<ShoppingIcon/>} title="Orders" value="12,480"/>
        <Stat icon={<Users size={21}/>} title="Customers" value="18,920"/>
        <Stat icon={<Store size={21}/>} title="Tenants" value="128"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:"20px"}}>
        <div style={chartCard}>
          <h2>Marketplace Performance</h2>
          <p>Monthly order activity</p>
          <div style={bars}>
            {[45,62,54,76,68,88,72,94,81,96,86,100].map((h,i)=>(
              <div key={i} style={barWrap}>
                <div style={{...bar,height:`${h}%`}}/>
                <small>{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</small>
              </div>
            ))}
          </div>
        </div>

        <div style={chartCard}>
          <h2>Platform Health</h2>
          <p>Current system status</p>
          {["API Gateway","User Service","Product Service","Order Service","Payment Service","Eureka"].map(x=>(
            <div key={x} style={health}>
              <span>{x}</span>
              <b><CheckCircle2 size={15}/> Operational</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminSettings(){
  const [saved,setSaved]=useState(false);

  return(
    <div style={page}>
      <Header eyebrow="PLATFORM CONFIGURATION" title="Settings" desc="Configure MarketGrid platform preferences and security."/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
        <div style={settingsCard}>
          <Settings size={24} color="#2864e6"/>
          <h2>Platform Settings</h2>
          <p>General marketplace configuration.</p>

          <label>Platform Name<input defaultValue="MarketGrid"/></label>
          <label>Support Email<input defaultValue="support@marketgrid.com"/></label>
          <label>Currency<input defaultValue="INR (₹)"/></label>
        </div>

        <div style={settingsCard}>
          <ShieldCheck size={24} color="#2864e6"/>
          <h2>Security</h2>
          <p>Authentication and access configuration.</p>

          <Toggle text="JWT Authentication" checked/>
          <Toggle text="Role Based Authorization" checked/>
          <Toggle text="Tenant Isolation" checked/>
          <Toggle text="Secure API Gateway" checked/>
        </div>
      </div>

      <button style={{...primary,marginTop:"20px"}} onClick={()=>setSaved(true)}>
        {saved?<><CheckCircle2 size={17}/> Settings Saved</>:<>Save Changes</>}
      </button>
    </div>
  );
}

function Header({eyebrow,title,desc}){
  return(
    <div style={{
      marginBottom:"30px",
      display:"flex",
      justifyContent:"space-between",
      alignItems:"flex-end"
    }}>
      <div>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <h1 style={h1}>{title}</h1>
        <p style={descStyle}>{desc}</p>
      </div>
    </div>
  );
}

function Stat({icon,title,value}){
  return <div style={stat}>
    <div style={statIcon}>{icon}</div>
    <span>{title}</span>
    <strong>{value}</strong>
    <small>Platform data</small>
  </div>;
}

function Status({status}){
  return <span style={{
    display:"inline-flex",
    alignItems:"center",
    gap:"5px",
    padding:"6px 10px",
    borderRadius:"20px",
    background:status==="ACTIVE"||status==="DELIVERED"||status==="CONFIRMED"?"#eaf8f0":"#fff4df",
    color:status==="ACTIVE"||status==="DELIVERED"||status==="CONFIRMED"?"#18834b":"#a56b00",
    fontSize:"11px",
    fontWeight:800
  }}><CheckCircle2 size={13}/>{status}</span>;
}

function Role({role}){
  return <span style={{
    padding:"5px 9px",
    borderRadius:"7px",
    background:"#edf4ff",
    color:"#2864e6",
    fontSize:"11px",
    fontWeight:800
  }}>{role.replace("_"," ")}</span>;
}

function Toggle({text,checked}){
  return <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    padding:"14px 0",
    borderBottom:"1px solid #edf0f5"
  }}>
    <span style={{color:"#344159",fontWeight:600}}>{text}</span>
    <span style={{
      width:"40px",height:"22px",borderRadius:"20px",
      background:checked?"#2864e6":"#cbd3df",
      position:"relative"
    }}>
      <span style={{
        position:"absolute",width:"16px",height:"16px",
        borderRadius:"50%",background:"#fff",top:"3px",
        left:checked?"21px":"3px"
      }}/>
    </span>
  </div>;
}

function ShoppingIcon(){return <Package size={21}/>}

const page={minHeight:"100%",padding:"36px 42px",background:"#f5f7fb"};
const eyebrowStyle={color:"#2864e6",fontSize:"12px",fontWeight:800,letterSpacing:"2.5px",marginBottom:"8px"};
const h1={margin:"0 0 8px",fontSize:"38px",fontWeight:800,color:"#17233c"};
const descStyle={margin:0,color:"#75839a",fontSize:"15px"};
const statsGrid={display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:"18px",marginBottom:"24px"};
const stat={background:"#fff",border:"1px solid #e2e7ef",borderRadius:"15px",padding:"19px",boxShadow:"0 3px 12px rgba(30,45,75,.04)"};
const statIcon={width:"42px",height:"42px",borderRadius:"11px",background:"#edf4ff",color:"#2864e6",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"13px"};
const toolbar={display:"flex",gap:"10px",alignItems:"center",marginBottom:"18px"};
const searchBox={display:"flex",alignItems:"center",gap:"9px",background:"#fff",border:"1px solid #dfe5ee",borderRadius:"10px",padding:"0 13px",height:"43px",flex:1};
const primary={display:"flex",alignItems:"center",gap:"7px",border:0,borderRadius:"10px",background:"#2864e6",color:"#fff",padding:"11px 17px",fontWeight:800,cursor:"pointer"};
const secondary={display:"flex",alignItems:"center",gap:"7px",border:"1px solid #dce3ee",borderRadius:"10px",background:"#fff",padding:"10px 15px",fontWeight:700,cursor:"pointer"};
const tableCard={background:"#fff",border:"1px solid #e2e7ef",borderRadius:"16px",overflow:"hidden",boxShadow:"0 3px 12px rgba(30,45,75,.04)"};
const tableHead={padding:"19px 22px",borderBottom:"1px solid #edf0f5"};
const table={width:"100%",borderCollapse:"collapse"};
const more={border:0,background:"transparent",cursor:"pointer",color:"#8794a8"};
const chartCard={background:"#fff",border:"1px solid #e2e7ef",borderRadius:"16px",padding:"22px"};
const bars={height:"260px",display:"flex",alignItems:"flex-end",gap:"12px",padding:"25px 10px 0"};
const barWrap={height:"100%",flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",gap:"8px"};
const bar={width:"100%",maxWidth:"34px",borderRadius:"7px 7px 2px 2px",background:"#2864e6"};
const health={display:"flex",justifyContent:"space-between",padding:"13px 0",borderBottom:"1px solid #edf0f5"};
const settingsCard={background:"#fff",border:"1px solid #e2e7ef",borderRadius:"16px",padding:"24px"};