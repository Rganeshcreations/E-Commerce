import React,{useEffect,useMemo,useState} from "react";
import {Link} from "react-router-dom";
import {
  Package,Boxes,ShoppingBag,IndianRupee,Plus,
  ArrowUpRight,RefreshCw,Truck,Store,ChevronRight
} from "lucide-react";
import {api} from "../services/api";

export default function VendorDashboard(){
  const [products,setProducts]=useState([]);
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=async()=>{
    try{
      setLoading(true);
      setError("");

      const vendor = await api.myVendor();
      const [p, o] = await Promise.all([
        api.productsByVendor(vendor.id),
        api.orders()
      ]);

      setProducts(Array.isArray(p) ? p : []);
      setOrders(Array.isArray(o) ? o : []);
    }catch(e){
      setError(e.message);
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{load()},[]);

  const stock=useMemo(
    ()=>products.reduce((s,p)=>s+Number(p.stockQuantity||0),0),
    [products]
  );

  const revenue=useMemo(
    ()=>orders.reduce((s,o)=>s+Number(o.totalAmount||0),0),
    [orders]
  );

  const lowStock=products.filter(p=>Number(p.stockQuantity||0)<=5);

  const recentOrders=[...orders]
    .sort((a,b)=>Number(b.id)-Number(a.id))
    .slice(0,5);

  return(
    <div style={{
      minHeight:"100%",
      background:"#f5f7fb",
      padding:"36px 42px"
    }}>

      {/* HEADER */}
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"flex-end",
        gap:"20px",
        flexWrap:"wrap",
        marginBottom:"30px"
      }}>
        <div>
          <div style={{
            color:"#2864e6",
            fontSize:"12px",
            fontWeight:"800",
            letterSpacing:"2.5px",
            marginBottom:"8px"
          }}>
            VENDOR WORKSPACE
          </div>

          <h1 style={{
            margin:"0 0 8px",
            color:"#17233c",
            fontSize:"38px",
            fontWeight:"800"
          }}>
            Store Overview
          </h1>

          <p style={{
            margin:0,
            color:"#75839a",
            fontSize:"15px"
          }}>
            Manage your products, inventory and marketplace orders.
          </p>
        </div>

        <button
          onClick={load}
          style={{
            display:"flex",
            alignItems:"center",
            gap:"8px",
            border:"1px solid #dce3ee",
            background:"#fff",
            borderRadius:"10px",
            padding:"11px 17px",
            fontWeight:"700",
            cursor:"pointer"
          }}
        >
          <RefreshCw size={16}/>
          Refresh
        </button>
      </div>

      {error&&(
        <div style={{
          background:"#fff0f0",
          border:"1px solid #ffd0d0",
          color:"#c43d3d",
          borderRadius:"12px",
          padding:"13px 16px",
          marginBottom:"20px"
        }}>
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,minmax(0,1fr))",
        gap:"18px",
        marginBottom:"28px"
      }}>

        <Stat
          icon={<Package size={21}/>}
          title="My Products"
          value={loading?"—":products.length}
          note="Active store products"
        />

        <Stat
          icon={<Boxes size={21}/>}
          title="Total Stock"
          value={loading?"—":stock}
          note="Units available"
        />

        <Stat
          icon={<Truck size={21}/>}
          title="My Orders"
          value={loading?"—":orders.length}
          note="Marketplace orders"
        />

        <Stat
          icon={<IndianRupee size={21}/>}
          title="Order Value"
          value={loading?"—":"₹"+revenue.toLocaleString("en-IN")}
          note="Total order value"
        />
      </div>

      {/* QUICK ACTIONS */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,minmax(0,1fr))",
        gap:"18px",
        marginBottom:"28px"
      }}>

        <Quick
          to="/vendor/products"
          icon={<Plus size={22}/>}
          title="Add Product"
          text="Create a new product for your store"
        />

        <Quick
          to="/vendor/inventory"
          icon={<Boxes size={22}/>}
          title="Manage Inventory"
          text="Update stock and monitor low inventory"
        />

        <Quick
          to="/vendor/orders"
          icon={<Truck size={22}/>}
          title="Process Orders"
          text="Review customer orders and status"
        />
      </div>

      {/* MAIN GRID */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"1.5fr 1fr",
        gap:"20px"
      }}>

        {/* RECENT ORDERS */}
        <section style={panel}>
          <div style={panelHead}>
            <div>
              <h2 style={title}>Recent Orders</h2>
              <p style={subtitle}>Latest activity from your store</p>
            </div>

            <Link
              to="/vendor/orders"
              style={viewLink}
            >
              View all <ArrowUpRight size={15}/>
            </Link>
          </div>

          {recentOrders.length===0 ? (
            <Empty text="No orders available"/>
          ):(
            <div>
              {recentOrders.map(order=>(
                <div
                  key={order.id}
                  style={{
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"center",
                    padding:"15px 0",
                    borderBottom:"1px solid #edf0f5",
                    gap:"15px"
                  }}
                >
                  <div style={{
                    display:"flex",
                    alignItems:"center",
                    gap:"12px"
                  }}>
                    <div style={{
                      width:"40px",
                      height:"40px",
                      borderRadius:"10px",
                      background:"#edf4ff",
                      color:"#2864e6",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center"
                    }}>
                      <ShoppingBag size={19}/>
                    </div>

                    <div>
                      <strong style={{color:"#202d45"}}>
                        Order #{order.id}
                      </strong>

                      <small style={{
                        display:"block",
                        color:"#8995a8",
                        marginTop:"3px"
                      }}>
                        Customer #{order.customerId}
                      </small>
                    </div>
                  </div>

                  <div style={{textAlign:"right"}}>
                    <strong style={{
                      display:"block",
                      color:"#202d45"
                    }}>
                      ₹{Number(order.totalAmount||0).toLocaleString("en-IN")}
                    </strong>

                    <span style={{
                      fontSize:"11px",
                      fontWeight:"800",
                      color:"#2864e6"
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* INVENTORY */}
        <section style={panel}>
          <div style={panelHead}>
            <div>
              <h2 style={title}>Inventory Health</h2>
              <p style={subtitle}>Products requiring attention</p>
            </div>

            <Link
              to="/vendor/inventory"
              style={viewLink}
            >
              Manage <ArrowUpRight size={15}/>
            </Link>
          </div>

          {lowStock.length===0 ? (
            <div style={{
              padding:"30px 10px",
              textAlign:"center",
              color:"#75839a"
            }}>
              <Boxes size={38} color="#2864e6"/>
              <p>All products have healthy stock levels.</p>
            </div>
          ):(
            lowStock.map(p=>(
              <div
                key={p.id}
                style={{
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"space-between",
                  padding:"14px 0",
                  borderBottom:"1px solid #edf0f5"
                }}
              >
                <div style={{
                  display:"flex",
                  alignItems:"center",
                  gap:"11px"
                }}>
                  <div style={{
                    width:"38px",
                    height:"38px",
                    borderRadius:"9px",
                    background:"#fff3e9",
                    color:"#e26b25",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center"
                  }}>
                    <Package size={18}/>
                  </div>

                  <div>
                    <strong style={{color:"#26334b"}}>
                      {p.productName}
                    </strong>
                    <small style={{
                      display:"block",
                      color:"#8995a8"
                    }}>
                      Product #{p.id}
                    </small>
                  </div>
                </div>

                <strong style={{
                  color:Number(p.stockQuantity)<=2?"#d34b4b":"#d27a16"
                }}>
                  {p.stockQuantity} left
                </strong>
              </div>
            ))
          )}
        </section>
      </div>

      {/* PRODUCT PREVIEW */}
      <section style={{
        ...panel,
        marginTop:"20px"
      }}>
        <div style={panelHead}>
          <div>
            <h2 style={title}>My Products</h2>
            <p style={subtitle}>Products currently listed in your store</p>
          </div>

          <Link to="/vendor/products" style={viewLink}>
            Manage products <ArrowUpRight size={15}/>
          </Link>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(3,minmax(0,1fr))",
          gap:"14px"
        }}>
          {products.slice(0,3).map(p=>(
            <div
              key={p.id}
              style={{
                border:"1px solid #e5e9f0",
                borderRadius:"12px",
                padding:"16px",
                background:"#fbfcfe"
              }}
            >
              <div style={{
                width:"45px",
                height:"45px",
                borderRadius:"11px",
                background:"#edf4ff",
                color:"#2864e6",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                marginBottom:"12px"
              }}>
                <Package size={21}/>
              </div>

              <strong style={{
                display:"block",
                color:"#202d45",
                marginBottom:"5px"
              }}>
                {p.productName}
              </strong>

              <span style={{
                color:"#75839a",
                fontSize:"13px"
              }}>
                Stock: {p.stockQuantity}
              </span>

              <strong style={{
                display:"block",
                marginTop:"9px",
                color:"#17233c"
              }}>
                ₹{Number(p.price||0).toLocaleString("en-IN")}
              </strong>
            </div>
          ))}

          {!products.length&&(
            <Empty text="No products found"/>
          )}
        </div>
      </section>

      <div style={{marginTop:"25px"}}>
        <Link
          to="/vendor/settings"
          style={{
            color:"#75839a",
            textDecoration:"none",
            fontSize:"13px"
          }}
        >
          Store settings →
        </Link>
      </div>
    </div>
  );
}

function Stat({icon,title,value,note}){
  return(
    <div style={{
      background:"#fff",
      border:"1px solid #e2e7ef",
      borderRadius:"15px",
      padding:"19px",
      boxShadow:"0 3px 12px rgba(30,45,75,.045)"
    }}>
      <div style={{
        width:"42px",
        height:"42px",
        borderRadius:"11px",
        background:"#edf4ff",
        color:"#2864e6",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        marginBottom:"14px"
      }}>
        {icon}
      </div>

      <div style={{
        color:"#7d899d",
        fontSize:"12px",
        fontWeight:"700"
      }}>
        {title}
      </div>

      <div style={{
        color:"#17233c",
        fontSize:"25px",
        fontWeight:"800",
        margin:"5px 0"
      }}>
        {value}
      </div>

      <div style={{
        color:"#9aa5b6",
        fontSize:"11px"
      }}>
        {note}
      </div>
    </div>
  );
}

function Quick({to,icon,title,text}){
  return(
    <Link
      to={to}
      style={{
        textDecoration:"none",
        background:"#fff",
        border:"1px solid #e2e7ef",
        borderRadius:"14px",
        padding:"19px",
        display:"flex",
        alignItems:"center",
        gap:"14px",
        boxShadow:"0 3px 12px rgba(30,45,75,.035)"
      }}
    >
      <div style={{
        width:"43px",
        height:"43px",
        borderRadius:"11px",
        background:"#edf4ff",
        color:"#2864e6",
        display:"flex",
        alignItems:"center",
        justifyContent:"center"
      }}>
        {icon}
      </div>

      <div style={{flex:1}}>
        <strong style={{
          display:"block",
          color:"#202d45",
          marginBottom:"4px"
        }}>
          {title}
        </strong>

        <span style={{
          color:"#8592a7",
          fontSize:"12px"
        }}>
          {text}
        </span>
      </div>

      <ChevronRight size={18} color="#9aa6b8"/>
    </Link>
  );
}

function Empty({text}){
  return(
    <div style={{
      padding:"25px",
      textAlign:"center",
      color:"#8995a8"
    }}>
      {text}
    </div>
  );
}

const panel={
  background:"#fff",
  border:"1px solid #e2e7ef",
  borderRadius:"16px",
  padding:"20px",
  boxShadow:"0 3px 12px rgba(30,45,75,.04)"
};

const panelHead={
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  gap:"15px",
  marginBottom:"12px"
};

const title={
  margin:0,
  color:"#202d45",
  fontSize:"18px",
  fontWeight:"800"
};

const subtitle={
  margin:"5px 0 0",
  color:"#8995a8",
  fontSize:"12px"
};

const viewLink={
  display:"flex",
  alignItems:"center",
  gap:"5px",
  textDecoration:"none",
  color:"#2864e6",
  fontWeight:"700",
  fontSize:"12px"
};