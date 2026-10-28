import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Users, Clock } from "lucide-react";
import { api } from "../services/api";

export default function TenantVendors() {
  const [applications, setApplications] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pending, vendorRows] = await Promise.all([
        api.pendingVendorApplications(),
        api.vendors()
      ]);
      setApplications(Array.isArray(pending) ? pending : []);
      setVendors(Array.isArray(vendorRows) ? vendorRows : []);
    } catch (e) {
      setError(e.message || "Unable to load tenant vendor data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function review(application, approve) {
    const promptText = approve
      ? "Optional approval message for the vendor:"
      : "Enter a reason for rejecting this application:";
    const reviewMessage = window.prompt(promptText, "");
    if (reviewMessage === null) return;
    if (!approve && !reviewMessage.trim()) {
      setError("A rejection message is required.");
      return;
    }
    setBusyId(application.id);
    setError("");
    setMessage("");
    try {
      if (approve) await api.approveVendorApplication(application.id, reviewMessage.trim());
      else await api.rejectVendorApplication(application.id, reviewMessage.trim());
      setMessage(approve ? "Vendor application approved." : "Vendor application rejected.");
      await refresh();
    } catch (e) {
      setError(e.message || "Unable to review this application.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="content" style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <p style={{ color: "#2864e6", fontWeight: 700, letterSpacing: 2, fontSize: 12 }}>TENANT MANAGEMENT</p>
          <h1 style={{ margin: "6px 0" }}>Vendor Applications</h1>
          <p style={{ color: "#64748b" }}>Review applications submitted to your store. Other tenants' applications are not shown.</p>
        </div>
        <button className="secondary-btn" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div role="alert" style={{ margin: "16px 0", padding: 12, borderRadius: 8, background: "#fef2f2", color: "#b42318" }}>{error}</div>}
      {message && <div role="status" style={{ margin: "16px 0", padding: 12, borderRadius: 8, background: "#ecfdf3", color: "#067647" }}>{message}</div>}

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock size={20} /> Pending applications ({applications.length})</h2>
        {loading ? <p>Loading applications…</p> : applications.length === 0 ? <p>No pending vendor applications for this store.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead><tr>{["Applicant", "Email", "Business", "Submitted", "Actions"].map(x => <th key={x} style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e2e8f0" }}>{x}</th>)}</tr></thead>
              <tbody>{applications.map(app => <tr key={app.id}>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{app.applicantName}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{app.email}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{app.businessName}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "—"}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                  <button disabled={busyId !== null} onClick={() => review(app, true)} style={{ marginRight: 8, padding: "8px 10px", border: 0, borderRadius: 7, background: "#15803d", color: "white", cursor: "pointer" }}><CheckCircle2 size={15} /> Approve</button>
                  <button disabled={busyId !== null} onClick={() => review(app, false)} style={{ padding: "8px 10px", border: 0, borderRadius: 7, background: "#b42318", color: "white", cursor: "pointer" }}><XCircle size={15} /> Reject</button>
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><Users size={20} /> Approved vendors ({vendors.length})</h2>
        {loading ? <p>Loading vendors…</p> : vendors.length === 0 ? <p>No approved vendors yet.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
              <thead><tr>{["Vendor", "Email", "Business", "Status"].map(x => <th key={x} style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e2e8f0" }}>{x}</th>)}</tr></thead>
              <tbody>{vendors.map(v => <tr key={v.id}>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{v.vendorName}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{v.email}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{v.businessName}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{v.status}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
