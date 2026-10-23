import React, { useMemo, useState } from "react";
import {
  Users, UserPlus, Search, RefreshCw, X,
  ShieldCheck, Store, User, Mail, Lock, Phone, Building2
} from "lucide-react";

const API = "http://localhost:8080";

const initialUsers = [
  { id: 7, fullName: "Super Admin", email: "superadmin@marketgrid.com", role: "SUPER_ADMIN", tenantId: "Platform", status: "ACTIVE" },
  { id: 1, fullName: "Admin User", email: "admin@test.com", role: "TENANT_ADMIN", tenantId: "Tech Store", status: "ACTIVE" },
  { id: 12, fullName: "Krishna", email: "krishna@gmail.com", role: "VENDOR", tenantId: "Tech Store", status: "ACTIVE" },
  { id: 10, fullName: "Customer One", email: "customer@test.com", role: "CUSTOMER", tenantId: "Tech Store", status: "ACTIVE" },
  { id: 15, fullName: "Rahul Kumar", email: "rahul@test.com", role: "CUSTOMER", tenantId: "Gear Hub", status: "ACTIVE" }
];

function roleClass(role) {
  if (role === "SUPER_ADMIN") return "blue";
  if (role === "TENANT_ADMIN") return "purple";
  if (role === "VENDOR") return "orange";
  return "green";
}

export default function AdminUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    businessName: "",
    role: "CUSTOMER",
    tenantId: "1"
  });

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return users;

    return users.filter(u =>
      `${u.fullName} ${u.email} ${u.role} ${u.tenantId}`
        .toLowerCase()
        .includes(q)
    );
  }, [users, search]);

  function updateField(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function openAdd(role) {
    setMessage("");

    setForm({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      businessName: "",
      role,
      tenantId: "1"
    });

    setShowModal(true);
  }

  async function createUser(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const token = localStorage.getItem("marketgrid_token");

    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          tenantId: Number(form.tenantId),
          role: form.role
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          `Registration failed (HTTP ${response.status})`
        );
      }

      const createdUser = data.user || data;

      if (form.role === "VENDOR") {
        const vendorResponse = await fetch(`${API}/api/vendors`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            tenantId: Number(form.tenantId),
            vendorName: form.fullName,
            email: form.email,
            phone: form.phone,
            businessName:
              form.businessName || `${form.fullName}'s Store`,
            status: "ACTIVE",
            createdAt: new Date().toISOString()
          })
        });

        const vendorData =
          await vendorResponse.json().catch(() => ({}));

        if (!vendorResponse.ok) {
          throw new Error(
            vendorData.message ||
            vendorData.error ||
            `Vendor creation failed (HTTP ${vendorResponse.status})`
          );
        }
      }

      const newUser = {
        id: createdUser.id || Date.now(),
        fullName: createdUser.fullName || form.fullName,
        email: createdUser.email || form.email,
        role: form.role,
        tenantId:
          Number(form.tenantId) === 1
            ? "Tech Store"
            : `Tenant #${form.tenantId}`,
        status: "ACTIVE"
      };

      setUsers(prev => [...prev, newUser]);

      setShowModal(false);

      setMessage(
        form.role === "VENDOR"
          ? "Vendor account and vendor profile created successfully."
          : "Customer account created successfully."
      );

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">

      <div className="page-head">
        <div>
          <p className="eyebrow">SUPER ADMINISTRATION</p>
          <h1>Users Directory</h1>
          <p>
            Manage customer, vendor and administrator accounts.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          <button
            className="secondary-btn"
            onClick={() => setUsers([...users])}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            className="primary-btn"
            onClick={() => openAdd("CUSTOMER")}
          >
            <UserPlus size={17} />
            Add Customer
          </button>

          <button
            className="primary-btn"
            onClick={() => openAdd("VENDOR")}
          >
            <Store size={17} />
            Add Vendor
          </button>
        </div>
      </div>

      {message && (
        <div
          className="info-box"
          style={{ marginBottom: "18px" }}
        >
          {message}
        </div>
      )}

      <div className="stats">

        <div className="stat">
          <div className="stat-icon blue">
            <Users size={20} />
          </div>
          <div>
            <span>Total Users</span>
            <strong>{users.length}</strong>
            <small>Registered accounts</small>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon green">
            <User size={20} />
          </div>
          <div>
            <span>Customers</span>
            <strong>
              {users.filter(u => u.role === "CUSTOMER").length}
            </strong>
            <small>Marketplace buyers</small>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon purple">
            <Store size={20} />
          </div>
          <div>
            <span>Vendors</span>
            <strong>
              {users.filter(u => u.role === "VENDOR").length}
            </strong>
            <small>Marketplace sellers</small>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon orange">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span>Admins</span>
            <strong>
              {users.filter(u => u.role.includes("ADMIN")).length}
            </strong>
            <small>Administration accounts</small>
          </div>
        </div>

      </div>

      <div className="table-card">

        <div className="table-head">

          <div>
            <b>Users Directory</b>
            <small>{filteredUsers.length} records found</small>
          </div>

          <div
            className="global-search"
            style={{
              maxWidth: "360px",
              margin: 0
            }}
          >
            <Search size={17} />

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
            />
          </div>

        </div>

        <div style={{ overflowX: "auto" }}>

          <table>

            <thead>
              <tr>
                <th>ID</th>
                <th>USER</th>
                <th>ROLE</th>
                <th>TENANT</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>

              {filteredUsers.map(user => (

                <tr key={`${user.id}-${user.email}`}>

                  <td>#{user.id}</td>

                  <td>
                    <b>{user.fullName}</b>

                    <small
                      style={{
                        display: "block",
                        color: "#718096"
                      }}
                    >
                      {user.email}
                    </small>
                  </td>

                  <td>
                    <span
                      className={`badge ${roleClass(user.role)}`}
                    >
                      {user.role.replace("_", " ")}
                    </span>
                  </td>

                  <td>{user.tenantId}</td>

                  <td>
                    <span className="badge green">
                      ACTIVE
                    </span>
                  </td>

                </tr>

              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "35px"
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {showModal && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >

          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: "560px",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 25px 70px rgba(0,0,0,.18)"
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "22px"
              }}
            >

              <div>
                <p className="eyebrow">
                  CREATE ACCOUNT
                </p>

                <h2 style={{ margin: 0 }}>
                  {form.role === "VENDOR"
                    ? "Add Vendor"
                    : "Add Customer"}
                </h2>
              </div>

              <button
                className="icon-btn"
                type="button"
                onClick={() => setShowModal(false)}
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={createUser}
              className="auth-form"
            >

              <label>
                Full Name

                <div style={{ position: "relative" }}>
                  <User
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 13
                    }}
                  />

                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={updateField}
                    placeholder="Enter full name"
                    style={{ paddingLeft: "38px" }}
                    required
                  />
                </div>
              </label>

              <label>
                Email

                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 13
                    }}
                  />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="user@example.com"
                    style={{ paddingLeft: "38px" }}
                    required
                  />
                </div>
              </label>

              <label>
                Password

                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 13
                    }}
                  />

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={updateField}
                    placeholder="Minimum 6 characters"
                    style={{ paddingLeft: "38px" }}
                    minLength="6"
                    required
                  />
                </div>
              </label>

              <label>
                Tenant ID

                <input
                  type="number"
                  name="tenantId"
                  value={form.tenantId}
                  onChange={updateField}
                  min="1"
                  required
                />
              </label>

              {form.role === "VENDOR" && (
                <>
                  <label>
                    Phone

                    <div style={{ position: "relative" }}>
                      <Phone
                        size={16}
                        style={{
                          position: "absolute",
                          left: 12,
                          top: 13
                        }}
                      />

                      <input
                        name="phone"
                        value={form.phone}
                        onChange={updateField}
                        placeholder="10-digit phone number"
                        style={{ paddingLeft: "38px" }}
                        required
                      />
                    </div>
                  </label>

                  <label>
                    Business Name

                    <div style={{ position: "relative" }}>
                      <Building2
                        size={16}
                        style={{
                          position: "absolute",
                          left: 12,
                          top: 13
                        }}
                      />

                      <input
                        name="businessName"
                        value={form.businessName}
                        onChange={updateField}
                        placeholder="Store / business name"
                        style={{ paddingLeft: "38px" }}
                        required
                      />
                    </div>
                  </label>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "8px"
                }}
              >

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading
                    ? "Creating..."
                    : form.role === "VENDOR"
                      ? "Create Vendor"
                      : "Create Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}