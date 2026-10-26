import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  Users, UserPlus, Search, RefreshCw, X,
  ShieldCheck, Store, User, Mail, Lock, Phone, Building2
} from "lucide-react";

const API = "http://localhost:8080";

function roleClass(role) {
  if (role === "SUPER_ADMIN") return "blue";
  if (role === "TENANT_ADMIN") return "purple";
  if (role === "VENDOR") return "orange";
  return "green";
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadUsers() {
    setLoadingUsers(true);
    setMessage("");
    try {
      const data = await api.users();
      const rows = Array.isArray(data) ? data : [];
      setUsers(rows.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        status: user.active ? "ACTIVE" : "INACTIVE"
      })));
    } catch (error) {
      setMessage(error.message || "Unable to load users from the server.");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);


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

    try {
      const createdUser = await api.createUser({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        tenantId: Number(form.tenantId),
        role: form.role
      });

      if (form.role === "VENDOR") {
        try {
          await api.createVendor({
            tenantId: Number(form.tenantId),
            vendorName: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            businessName: form.businessName.trim(),
            status: "ACTIVE"
          });
        } catch (vendorError) {
          // Compensate if the vendor profile cannot be created so an orphan
          // VENDOR login is not left behind without a matching vendor record.
          if (createdUser?.id) {
            try { await api.deleteUser(createdUser.id); } catch { /* report the original failure */ }
          }
          throw vendorError;
        }
      }

      setShowModal(false);
      await loadUsers();
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
            onClick={loadUsers}
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
            <strong>{loadingUsers ? "…" : users.length}</strong>
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
              {loadingUsers ? "…" : users.filter(u => u.role === "CUSTOMER").length}
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
              {loadingUsers ? "…" : users.filter(u => u.role === "VENDOR").length}
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
              {loadingUsers ? "…" : users.filter(u => u.role.includes("ADMIN")).length}
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

              {loadingUsers && <tr><td colSpan="5" style={{textAlign:"center",padding:"30px"}}>Loading users from the server...</td></tr>}

              {!loadingUsers && filteredUsers.map(user => (

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
                    <span className={`badge ${user.status === "ACTIVE" ? "green" : "red"}`}>
                      {user.status}
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
                    placeholder="Minimum 8 characters"
                    style={{ paddingLeft: "38px" }}
                    minLength="8"
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