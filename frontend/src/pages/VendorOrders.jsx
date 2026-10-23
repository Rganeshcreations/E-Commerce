import React,{useMemo,useState} from "react";
import {Link} from "react-router-dom";
import {
  Package,RefreshCw,ChevronRight,ShoppingBag,
  Clock3,Truck,CheckCircle2,IndianRupee,UserRound
} from "lucide-react";

const dummyOrders=[
  {
    id:108,
    customerId:15,
    status:"PLACED",
    customer:"Rahul Kumar",
    date:"25 Sep 2026",
    items:[
      {productId:1,productName:"Gaming Laptop",vendorId:1,quantity:1,price:65000}
    ],
    totalAmount:65000
  },
  {
    id:107,
    customerId:12,
    status:"CONFIRMED",
    customer:"Priya Sharma",
    date:"24 Sep 2026",
    items:[
      {productId:1,productName:"Gaming Laptop",vendorId:1,quantity:2,price:65000}
    ],
    totalAmount:130000
  },
  {
    id:106,
    customerId:8,
    status:"SHIPPED",
    customer:"Arjun Reddy",
    date:"23 Sep 2026",
    items:[
      {productId:1,productName:"Gaming Laptop",vendorId:1,quantity:1,price:65000}
    ],
    totalAmount:65000
  },
  {
    id:105,
    customerId:6,
    status:"DELIVERED",
    customer:"Suresh Kumar",
    date:"22 Sep 2026",
    items:[
      {productId:1,productName:"Gaming Laptop",vendorId:1,quantity:1,price:65000}
    ],
    totalAmount:65000
  }
];

const statusInfo={
  PLACED:{label:"New Order",icon:Clock3},
  CONFIRMED:{label:"Confirmed",icon:CheckCircle2},
  SHIPPED:{label:"Shipped",icon:Truck},
  DELIVERED:{label:"Delivered",icon:CheckCircle2}
};

export default function VendorOrders(){
  const [orders,setOrders]=useState(dummyOrders);
  const [filter,setFilter]=useState("ALL");

  const stats=useMemo(()=>({
    total:orders.length,
    pending:orders.filter(o=>o.status==="PLACED").length,
    shipped:orders.filter(o=>o.status==="SHIPPED").length,
    revenue:orders.reduce((s,o)=>s+Number(o.totalAmount||0),0)
  }),[orders]);

  const visible=filter==="ALL"
    ? orders
    : orders.filter(o=>o.status===filter);

  const refresh=()=>{
    setOrders([...dummyOrders]);
    setFilter("ALL");
  };

  const money=n=>"₹"+Number(n||0).toLocaleString("en-IN");

  return (
    <div style={{
      minHeight:"100%",
      padding:"36px 42px",
      background:"#f5f7fb"
    }}>

      {/* HEADER */}
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"flex-end",
        marginBottom:"30px",
        gap:"20px",
        flexWrap:"wrap"
      }}>
        <div>
          <div style={{
            color:"#2864e6",
            fontSize:"12px",
            fontWeight:"800",
            letterSpacing:"2.5px",
            marginBottom:"9px"
          }}>
            VENDOR ORDER MANAGEMENT
          </div>

          <h1 style={{
            margin:"0 0 8px",
            fontSize:"38px",
            lineHeight:"1.1",
            color:"#17233c",
            fontWeight:"800"
          }}>
            My Orders
          </h1>

          <p style={{
            margin:0,
            color:"#71809a",
            fontSize:"15px"
          }}>
            Manage orders containing products from your store.
          </p>
        </div>

        <button
          onClick={refresh}
          style={{
            display:"flex",
            alignItems:"center",
            gap:"8px",
            padding:"11px 18px",
            border:"1px solid #dbe2ee",
            borderRadius:"10px",
            background:"#fff",
            color:"#25324a",
            fontWeight:"700",
            cursor:"pointer",
            boxShadow:"0 2px 8px rgba(20,35,60,.05)"
          }}
        >
          <RefreshCw size={17}/>
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,minmax(0,1fr))",
        gap:"18px",
        marginBottom:"30px"
      }}>

        <StatCard
          icon={<ShoppingBag size={22}/>}
          title="Total Orders"
          value={stats.total}
          text="Orders received"
        />

        <StatCard
          icon={<Clock3 size={22}/>}
          title="New Orders"
          value={stats.pending}
          text="Need attention"
        />

        <StatCard
          icon={<Truck size={22}/>}
          title="Shipped"
          value={stats.shipped}
          text="Currently shipping"
        />

        <StatCard
          icon={<IndianRupee size={22}/>}
          title="Order Value"
          value={money(stats.revenue)}
          text="Total order value"
        />
      </div>

      {/* FILTER BAR */}
      <div style={{
        background:"#fff",
        border:"1px solid #e3e8f1",
        borderRadius:"14px",
        padding:"8px",
        display:"flex",
        gap:"6px",
        marginBottom:"20px",
        width:"fit-content",
        boxShadow:"0 2px 8px rgba(20,35,60,.04)"
      }}>
        {[
          ["ALL","All Orders"],
          ["PLACED","New"],
          ["CONFIRMED","Confirmed"],
          ["SHIPPED","Shipped"],
          ["DELIVERED","Delivered"]
        ].map(([value,label])=>(
          <button
            key={value}
            onClick={()=>setFilter(value)}
            style={{
              border:0,
              borderRadius:"9px",
              padding:"9px 16px",
              cursor:"pointer",
              fontWeight:"700",
              fontSize:"13px",
              background:filter===value?"#2864e6":"transparent",
              color:filter===value?"#fff":"#66748b"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ORDERS */}
      <div style={{
        display:"grid",
        gap:"16px"
      }}>

        {visible.map(order=>{
          const info=statusInfo[order.status]||statusInfo.PLACED;
          const StatusIcon=info.icon;

          return (
            <div
              key={order.id}
              style={{
                background:"#fff",
                border:"1px solid #e2e7ef",
                borderRadius:"16px",
                overflow:"hidden",
                boxShadow:"0 3px 12px rgba(30,45,75,.045)"
              }}
            >

              {/* ORDER TOP */}
              <div style={{
                padding:"18px 22px",
                borderBottom:"1px solid #edf0f5",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:"15px",
                flexWrap:"wrap"
              }}>

                <div style={{
                  display:"flex",
                  alignItems:"center",
                  gap:"14px"
                }}>
                  <div style={{
                    width:"44px",
                    height:"44px",
                    borderRadius:"11px",
                    background:"#edf4ff",
                    color:"#2864e6",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center"
                  }}>
                    <Package size={22}/>
                  </div>

                  <div>
                    <div style={{
                      fontSize:"16px",
                      fontWeight:"800",
                      color:"#17233c"
                    }}>
                      Order #{order.id}
                    </div>

                    <div style={{
                      display:"flex",
                      gap:"8px",
                      alignItems:"center",
                      color:"#8390a5",
                      fontSize:"13px",
                      marginTop:"4px"
                    }}>
                      <UserRound size={13}/>
                      {order.customer}
                      <span>•</span>
                      Customer #{order.customerId}
                      <span>•</span>
                      {order.date}
                    </div>
                  </div>
                </div>

                <div style={{
                  display:"flex",
                  alignItems:"center",
                  gap:"8px",
                  padding:"7px 12px",
                  borderRadius:"20px",
                  background:
                    order.status==="DELIVERED"?"#eaf9f0":
                    order.status==="SHIPPED"?"#edf5ff":
                    order.status==="CONFIRMED"?"#fff7df":"#fff1e8",
                  color:
                    order.status==="DELIVERED"?"#16834b":
                    order.status==="SHIPPED"?"#2864e6":
                    order.status==="CONFIRMED"?"#a36b00":"#d65b16",
                  fontSize:"12px",
                  fontWeight:"800"
                }}>
                  <StatusIcon size={15}/>
                  {info.label}
                </div>
              </div>

              {/* PRODUCT */}
              <div style={{
                padding:"18px 22px"
              }}>
                {order.items.map((item,index)=>(
                  <div
                    key={index}
                    style={{
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"space-between",
                      gap:"20px",
                      flexWrap:"wrap"
                    }}
                  >
                    <div style={{
                      display:"flex",
                      alignItems:"center",
                      gap:"14px"
                    }}>
                      <div style={{
                        width:"58px",
                        height:"58px",
                        borderRadius:"12px",
                        background:"linear-gradient(135deg,#eef4ff,#f6f8fc)",
                        display:"flex",
                        alignItems:"center",
                        justifyContent:"center",
                        color:"#2864e6"
                      }}>
                        <Package size={28}/>
                      </div>

                      <div>
                        <strong style={{
                          display:"block",
                          color:"#202d45",
                          fontSize:"15px",
                          marginBottom:"5px"
                        }}>
                          {item.productName}
                        </strong>

                        <div style={{
                          color:"#7b899f",
                          fontSize:"13px"
                        }}>
                          Product #{item.productId}
                          <span style={{margin:"0 8px"}}>•</span>
                          Vendor #{item.vendorId}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display:"flex",
                      alignItems:"center",
                      gap:"55px"
                    }}>
                      <div>
                        <small style={{
                          display:"block",
                          color:"#8a96a9",
                          fontSize:"11px",
                          marginBottom:"4px"
                        }}>
                          QUANTITY
                        </small>
                        <strong style={{color:"#26334b"}}>
                          {item.quantity}
                        </strong>
                      </div>

                      <div>
                        <small style={{
                          display:"block",
                          color:"#8a96a9",
                          fontSize:"11px",
                          marginBottom:"4px"
                        }}>
                          PRICE
                        </small>
                        <strong style={{color:"#26334b"}}>
                          {money(item.price)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div style={{
                background:"#fafbfe",
                borderTop:"1px solid #edf0f5",
                padding:"15px 22px",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:"15px"
              }}>
                <div>
                  <small style={{
                    display:"block",
                    color:"#8491a5",
                    fontSize:"11px",
                    fontWeight:"700",
                    marginBottom:"3px"
                  }}>
                    ORDER TOTAL
                  </small>

                  <strong style={{
                    color:"#17233c",
                    fontSize:"20px"
                  }}>
                    {money(order.totalAmount)}
                  </strong>
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  style={{
                    display:"flex",
                    alignItems:"center",
                    gap:"7px",
                    textDecoration:"none",
                    padding:"10px 15px",
                    borderRadius:"9px",
                    background:"#edf4ff",
                    color:"#2864e6",
                    fontWeight:"800",
                    fontSize:"13px"
                  }}
                >
                  View Details
                  <ChevronRight size={16}/>
                </Link>
              </div>
            </div>
          );
        })}

        {visible.length===0&&(
          <div style={{
            background:"#fff",
            border:"1px solid #e3e8f1",
            borderRadius:"16px",
            padding:"70px 20px",
            textAlign:"center"
          }}>
            <Package size={48} color="#8da0bd"/>
            <h2 style={{color:"#17233c",marginBottom:"8px"}}>
              No orders found
            </h2>
            <p style={{color:"#8290a8"}}>
              There are no orders in this category.
            </p>
          </div>
        )}
      </div>

      <div style={{marginTop:"25px"}}>
        <Link
          to="/vendor"
          style={{
            textDecoration:"none",
            color:"#2864e6",
            fontWeight:"700"
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      <style>{`
        @media(max-width:900px){
          .content{
            padding:24px !important;
          }
        }
        @media(max-width:700px){
          .page-title-row{
            flex-direction:column;
            align-items:flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({icon,title,value,text}){
  return (
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
        fontWeight:"700",
        marginBottom:"5px"
      }}>
        {title}
      </div>

      <div style={{
        color:"#17233c",
        fontSize:"24px",
        fontWeight:"800",
        marginBottom:"4px"
      }}>
        {value}
      </div>

      <div style={{
        color:"#9aa5b6",
        fontSize:"11px"
      }}>
        {text}
      </div>
    </div>
  );
}