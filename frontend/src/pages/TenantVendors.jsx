import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Ban,
  CheckCircle2,
  Package,
  ShoppingBag,
  X,
  Save
} from "lucide-react";

const initialVendors = [
  {
    id: 1,
    name: "Krishna",
    email: "krishna@gmail.com",
    business: "Tech Store",
    products: 2,
    orders: 8,
    status: "ACTIVE"
  },
  {
    id: 2,
    name: "Ravi Kumar",
    email: "ravi@gearhub.com",
    business: "Gear Hub",
    products: 14,
    orders: 21,
    status: "ACTIVE"
  },
  {
    id: 3,
    name: "Suresh",
    email: "suresh@smartworld.com",
    business: "Smart World",
    products: 9,
    orders: 17,
    status: "BLOCKED"
  }
];

export default function TenantVendors() {
  const [vendors, setVendors] = useState(initialVendors);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    business: ""
  });

  const filteredVendors = vendors.filter((vendor) =>
    `${vendor.name} ${vendor.email} ${vendor.business}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeCount = vendors.filter(
    (v) => v.status === "ACTIVE"
  ).length;

  const blockedCount = vendors.filter(
    (v) => v.status === "BLOCKED"
  ).length;

  const totalProducts = vendors.reduce(
    (sum, v) => sum + v.products,
    0
  );

  const openAddModal = () => {
    setEditingVendor(null);
    setForm({
      name: "",
      email: "",
      business: ""
    });
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor.id);
    setForm({
      name: vendor.name,
      email: vendor.email,
      business: vendor.business
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVendor(null);
  };

  const saveVendor = () => {
    if (!form.name || !form.email || !form.business) {
      alert("Please fill all vendor details.");
      return;
    }

    if (editingVendor) {
      setVendors(
        vendors.map((vendor) =>
          vendor.id === editingVendor
            ? {
                ...vendor,
                name: form.name,
                email: form.email,
                business: form.business
              }
            : vendor
        )
      );
    } else {
      const newVendor = {
        id:
          vendors.length > 0
            ? Math.max(...vendors.map((v) => v.id)) + 1
            : 1,
        name: form.name,
        email: form.email,
        business: form.business,
        products: 0,
        orders: 0,
        status: "ACTIVE"
      };

      setVendors([...vendors, newVendor]);
    }

    closeModal();
  };

  const toggleBlock = (id) => {
    setVendors(
      vendors.map((vendor) =>
        vendor.id === id
          ? {
              ...vendor,
              status:
                vendor.status === "ACTIVE"
                  ? "BLOCKED"
                  : "ACTIVE"
            }
          : vendor
      )
    );
  };

  const removeVendor = (id) => {
    const vendor = vendors.find((v) => v.id === id);

    if (
      window.confirm(
        `Remove ${vendor?.name || "this vendor"} from this tenant?`
      )
    ) {
      setVendors(vendors.filter((v) => v.id !== id));
    }
  };

  const resetDemo = () => {
    setVendors(initialVendors);
    setSearch("");
  };

  return (
    <div className="content" style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            VENDOR MANAGEMENT
          </div>

          <h1 style={styles.title}>
            Vendors
          </h1>

          <p style={styles.subtitle}>
            Add, manage, block and remove vendors belonging
            to your tenant.
          </p>
        </div>

        <button
          style={styles.primaryButton}
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add Vendor
        </button>
      </div>

      {/* STATISTICS */}
      <div style={styles.statsGrid}>

        <StatCard
          icon={<Users size={21} />}
          title="Total Vendors"
          value={vendors.length}
          text="Registered vendors"
        />

        <StatCard
          icon={<CheckCircle2 size={21} />}
          title="Active Vendors"
          value={activeCount}
          text="Currently active"
        />

        <StatCard
          icon={<Ban size={21} />}
          title="Blocked Vendors"
          value={blockedCount}
          text="Access restricted"
        />

        <StatCard
          icon={<Package size={21} />}
          title="Vendor Products"
          value={totalProducts}
          text="Products listed"
        />

      </div>

      {/* TOOLBAR */}
      <div style={styles.toolbar}>

        <div style={styles.searchBox}>
          <Search size={18} color="#8995a8" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors, business or email..."
            style={styles.searchInput}
          />
        </div>

        <button
          style={styles.secondaryButton}
          onClick={resetDemo}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      {/* VENDOR LIST */}
      <div style={styles.vendorGrid}>

        {filteredVendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            onEdit={() => openEditModal(vendor)}
            onToggle={() => toggleBlock(vendor.id)}
            onRemove={() => removeVendor(vendor.id)}
          />
        ))}

        {filteredVendors.length === 0 && (
          <div style={styles.empty}>
            <Users size={45} color="#9aa6b8" />

            <h2>No vendors found</h2>

            <p>
              Try another search or add a new vendor.
            </p>
          </div>
        )}

      </div>

      {/* MODAL */}
      {showModal && (
        <div style={styles.overlay}>

          <div style={styles.modal}>

            <div style={styles.modalHeader}>

              <div>
                <h2 style={styles.modalTitle}>
                  {editingVendor
                    ? "Edit Vendor"
                    : "Add Vendor"}
                </h2>

                <p style={styles.modalSubtitle}>
                  {editingVendor
                    ? "Update vendor information."
                    : "Create a new vendor for this tenant."}
                </p>
              </div>

              <button
                style={styles.closeButton}
                onClick={closeModal}
              >
                <X size={20} />
              </button>

            </div>

            <label style={styles.label}>
              Vendor Name

              <input
                style={styles.input}
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
                placeholder="Enter vendor name"
              />
            </label>

            <label style={styles.label}>
              Email

              <input
                style={styles.input}
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
                placeholder="vendor@example.com"
              />
            </label>

            <label style={styles.label}>
              Business Name

              <input
                style={styles.input}
                value={form.business}
                onChange={(e) =>
                  setForm({
                    ...form,
                    business: e.target.value
                  })
                }
                placeholder="Business / Store name"
              />
            </label>

            <div style={styles.modalActions}>

              <button
                style={styles.secondaryButton}
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                style={styles.primaryButton}
                onClick={saveVendor}
              >
                <Save size={16} />

                {editingVendor
                  ? "Save Changes"
                  : "Add Vendor"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

function VendorCard({
  vendor,
  onEdit,
  onToggle,
  onRemove
}) {
  const blocked = vendor.status === "BLOCKED";

  return (
    <div
      style={{
        ...styles.card,
        opacity: blocked ? 0.82 : 1
      }}
    >

      <div style={styles.cardHeader}>

        <div style={styles.vendorIdentity}>

          <div
            style={{
              ...styles.avatar,
              background: blocked
                ? "#eef0f3"
                : "#edf4ff",
              color: blocked
                ? "#7d899d"
                : "#2864e6"
            }}
          >
            {vendor.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 style={styles.vendorName}>
              {vendor.name}
            </h3>

            <span style={styles.vendorId}>
              Vendor #{vendor.id}
            </span>
          </div>

        </div>

        <span
          style={{
            ...styles.status,
            background: blocked
              ? "#fff0f0"
              : "#eaf8f0",
            color: blocked
              ? "#c44949"
              : "#17814b"
          }}
        >
          {blocked
            ? <Ban size={12} />
            : <CheckCircle2 size={12} />}

          {vendor.status}
        </span>

      </div>

      <div style={styles.businessSection}>

        <strong>
          {vendor.business}
        </strong>

        <span>
          {vendor.email}
        </span>

      </div>

      <div style={styles.metrics}>

        <Metric
          icon={<Package size={16} />}
          label="Products"
          value={vendor.products}
        />

        <Metric
          icon={<ShoppingBag size={16} />}
          label="Orders"
          value={vendor.orders}
        />

      </div>

      <div style={styles.actions}>

        <button
          style={styles.actionButton}
          onClick={onEdit}
        >
          <Edit3 size={14} />
          Edit
        </button>

        <button
          style={{
            ...styles.actionButton,
            color: blocked
              ? "#17814b"
              : "#b06b00"
          }}
          onClick={onToggle}
        >
          {blocked
            ? <CheckCircle2 size={14} />
            : <Ban size={14} />}

          {blocked ? "Unblock" : "Block"}
        </button>

        <button
          style={{
            ...styles.actionButton,
            color: "#c44949"
          }}
          onClick={onRemove}
        >
          <Trash2 size={14} />
          Remove
        </button>

      </div>

    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div style={styles.metric}>

      <div style={styles.metricIcon}>
        {icon}
      </div>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>

    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  text
}) {
  return (
    <div style={styles.statCard}>

      <div style={styles.statIcon}>
        {icon}
      </div>

      <span style={styles.statTitle}>
        {title}
      </span>

      <strong style={styles.statValue}>
        {value}
      </strong>

      <small style={styles.statText}>
        {text}
      </small>

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100%",
    background: "#f5f7fb",
    padding: "36px 42px"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "28px",
    flexWrap: "wrap"
  },

  eyebrow: {
    color: "#2864e6",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "2.5px",
    marginBottom: "8px"
  },

  title: {
    margin: "0 0 8px",
    color: "#17233c",
    fontSize: "38px",
    fontWeight: 800
  },

  subtitle: {
    margin: 0,
    color: "#75839a",
    fontSize: "15px"
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: 0,
    borderRadius: "10px",
    background: "#2864e6",
    color: "#fff",
    padding: "11px 17px",
    fontWeight: 800,
    cursor: "pointer"
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: "1px solid #dce3ee",
    borderRadius: "10px",
    background: "#fff",
    color: "#344159",
    padding: "10px 15px",
    fontWeight: 700,
    cursor: "pointer"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4,minmax(0,1fr))",
    gap: "18px",
    marginBottom: "22px"
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e2e7ef",
    borderRadius: "15px",
    padding: "19px",
    boxShadow:
      "0 3px 12px rgba(30,45,75,.04)"
  },

  statIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    background: "#edf4ff",
    color: "#2864e6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "13px"
  },

  statTitle: {
    display: "block",
    color: "#7d899d",
    fontSize: "12px",
    fontWeight: 700
  },

  statValue: {
    display: "block",
    color: "#17233c",
    fontSize: "26px",
    margin: "5px 0"
  },

  statText: {
    color: "#9aa5b6",
    fontSize: "11px"
  },

  toolbar: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
  },

  searchBox: {
    flex: 1,
    height: "43px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    background: "#fff",
    border: "1px solid #dfe5ee",
    borderRadius: "10px",
    padding: "0 13px"
  },

  searchInput: {
    width: "100%",
    border: 0,
    outline: 0,
    fontSize: "14px",
    color: "#26334b"
  },

  vendorGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: "18px"
  },

  card: {
    background: "#fff",
    border: "1px solid #e2e7ef",
    borderRadius: "16px",
    padding: "21px",
    boxShadow:
      "0 3px 12px rgba(30,45,75,.04)"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px"
  },

  vendorIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "13px"
  },

  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    fontSize: "19px",
    fontWeight: 800
  },

  vendorName: {
    margin: 0,
    color: "#17233c",
    fontSize: "17px"
  },

  vendorId: {
    display: "block",
    color: "#8491a5",
    fontSize: "12px",
    marginTop: "4px"
  },

  status: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: 800
  },

  businessSection: {
    marginTop: "18px",
    padding: "14px 0",
    borderTop: "1px solid #edf0f5",
    borderBottom: "1px solid #edf0f5"
  },

  metrics: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    margin: "15px 0"
  },

  metric: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f7f9fc",
    borderRadius: "10px",
    padding: "12px"
  },

  metricIcon: {
    color: "#2864e6"
  },

  actions: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr 1fr",
    gap: "8px"
  },

  actionButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "9px 7px",
    border: "1px solid #dce3ec",
    borderRadius: "8px",
    background: "#fff",
    color: "#344159",
    fontWeight: 700,
    fontSize: "12px",
    cursor: "pointer"
  },

  empty: {
    gridColumn: "1 / -1",
    background: "#fff",
    border: "1px solid #e2e7ef",
    borderRadius: "16px",
    padding: "70px 20px",
    textAlign: "center"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,25,45,.48)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },

  modal: {
    width: "100%",
    maxWidth: "520px",
    background: "#fff",
    borderRadius: "18px",
    padding: "26px",
    boxShadow: "0 20px 60px rgba(0,0,0,.18)"
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "22px"
  },

  modalTitle: {
    margin: 0,
    color: "#17233c",
    fontSize: "22px"
  },

  modalSubtitle: {
    margin: "6px 0 0",
    color: "#8491a5",
    fontSize: "13px"
  },

  closeButton: {
    width: "35px",
    height: "35px",
    border: 0,
    borderRadius: "9px",
    background: "#f3f5f8",
    color: "#526077",
    display: "grid",
    placeItems: "center",
    cursor: "pointer"
  },

  label: {
    display: "block",
    color: "#344159",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "14px"
  },

  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    marginTop: "7px",
    padding: "11px 12px",
    border: "1px solid #dce3ec",
    borderRadius: "9px",
    outline: "none",
    fontSize: "14px"
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px"
  }
};