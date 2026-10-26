
import React, { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const styles = {
    page: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: 28,
      color: "#17233c"
    },
    card: {
      background: "#fff",
      border: "1px solid #e2e7ef",
      borderRadius: 14,
      padding: 20,
      marginBottom: 22
    },
    button: {
      border: 0,
      borderRadius: 8,
      padding: "10px 14px",
      background: "#2864e6",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 700
    },
    secondaryButton: {
      border: "1px solid #dce3ec",
      borderRadius: 8,
      padding: "9px 13px",
      background: "#fff",
      color: "#17233c",
      cursor: "pointer",
      fontWeight: 600
    },
    dangerButton: {
      border: 0,
      borderRadius: 8,
      padding: "10px 14px",
      background: "#b42318",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 700
    },
    field: {
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      padding: 11,
      border: "1px solid #dce3ec",
      borderRadius: 8,
      margin: "7px 0 14px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 760
    },
    cell: {
      padding: 13,
      borderBottom: "1px solid #edf0f5",
      textAlign: "left",
      verticalAlign: "top"
    },
    muted: {
      color: "#64748b",
      fontSize: 13
    }
  };

  const loadTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const data = await api.tenants();
      setTenants(Array.isArray(data) ? data : data?.content ?? []);
    } catch (e) {
      setError(e.message || "Unable to load tenants.");
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoadingApplications(true);
    try {
      const data = await api.pendingTenantApplications();
      setApplications(Array.isArray(data) ? data : data?.content ?? []);
    } catch (e) {
      setError(e.message || "Unable to load applications.");
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setError("");
    await Promise.all([loadTenants(), loadApplications()]);
  }, [loadTenants, loadApplications]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  async function approveApplication(application) {
    const confirmed = window.confirm(
      `Approve "${application.storeName}" and create its tenant?`
    );

    if (!confirmed) return;

    setBusyId(application.id);
    setError("");
    setMessage("");

    try {
      await api.approveTenantApplication(application.id);
      setMessage(
        `Application #${application.id} approved. Tenant created successfully.`
      );
      await refreshAll();
    } catch (e) {
      setError(e.message || "Unable to approve application.");
    } finally {
      setBusyId(null);
    }
  }

  async function rejectApplication(applicationId) {
    if (!rejectionReason.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    setBusyId(applicationId);
    setError("");
    setMessage("");

    try {
      await api.rejectTenantApplication(
        applicationId,
        rejectionReason.trim()
      );

      setMessage(`Application #${applicationId} rejected.`);
      setRejectingId(null);
      setRejectionReason("");
      await loadApplications();
    } catch (e) {
      setError(e.message || "Unable to reject application.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleTenant(tenant) {
    setBusyId(`tenant-${tenant.id}`);
    setError("");
    setMessage("");

    try {
      await api.setTenantActive(tenant.id, !tenant.active);
      setMessage(
        `Tenant "${tenant.name}" ${
          tenant.active ? "deactivated" : "activated"
        } successfully.`
      );
      await loadTenants();
    } catch (e) {
      setError(e.message || "Unable to update tenant status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main style={styles.page}>
      <h1>Tenant Management</h1>
      <p style={styles.muted}>
        Review store applications and manage approved marketplace tenants.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fef3f2",
            color: "#b42318",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            background: "#ecfdf3",
            color: "#067647",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16
          }}
        >
          {message}
        </div>
      )}

      <section style={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div>
            <h2>Pending applications</h2>
            <p style={styles.muted}>
              Approving an application creates a tenant. Rejected applications
              are removed from this pending list.
            </p>
          </div>

          <button
            style={styles.secondaryButton}
            onClick={refreshAll}
            disabled={loadingApplications || loadingTenants || busyId !== null}
          >
            Refresh
          </button>
        </div>

        {loadingApplications ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p>No pending applications found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    "ID",
                    "Applicant",
                    "Email",
                    "Store",
                    "Requested slug",
                    "Business domain",
                    "Submitted",
                    "Actions"
                  ].map((heading) => (
                    <th key={heading} style={styles.cell}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td style={styles.cell}>{application.id}</td>
                    <td style={styles.cell}>{application.applicantName}</td>
                    <td style={styles.cell}>{application.applicantEmail}</td>
                    <td style={styles.cell}>{application.storeName}</td>
                    <td style={styles.cell}>{application.requestedSlug}</td>
                    <td style={styles.cell}>{application.requestedDomainSlug || "—"}</td>
                    <td style={styles.cell}>
                      {application.submittedAt
                        ? new Date(application.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td style={styles.cell}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap"
                        }}
                      >
                        <button
                          style={styles.button}
                          disabled={busyId !== null}
                          onClick={() => approveApplication(application)}
                        >
                          {busyId === application.id
                            ? "Please wait..."
                            : "Approve"}
                        </button>

                        <button
                          style={styles.dangerButton}
                          disabled={busyId !== null}
                          onClick={() => {
                            setError("");
                            setRejectingId(application.id);
                            setRejectionReason("");
                          }}
                        >
                          Reject
                        </button>
                      </div>

                      {rejectingId === application.id && (
                        <div style={{ minWidth: 220, marginTop: 12 }}>
                          <label>
                            Rejection reason
                            <textarea
                              style={styles.field}
                              value={rejectionReason}
                              onChange={(event) =>
                                setRejectionReason(event.target.value)
                              }
                              maxLength={1000}
                              rows={3}
                              placeholder="Explain why this application is rejected"
                            />
                          </label>

                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              style={styles.dangerButton}
                              disabled={busyId !== null}
                              onClick={() =>
                                rejectApplication(application.id)
                              }
                            >
                              Confirm rejection
                            </button>

                            <button
                              style={styles.secondaryButton}
                              disabled={busyId !== null}
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12
          }}
        >
          <div>
            <h2>Registered tenants</h2>
            <p style={styles.muted}>
              Manage the active status of existing marketplace stores.
            </p>
          </div>

          <button
            style={styles.secondaryButton}
            onClick={loadTenants}
            disabled={loadingTenants || busyId !== null}
          >
            Refresh
          </button>
        </div>

        {loadingTenants ? (
          <p>Loading tenants...</p>
        ) : tenants.length === 0 ? (
          <p>No tenants found, or the tenant list could not be loaded.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["ID", "Store", "Slug", "Status", "Created", "Action"].map(
                    (heading) => (
                      <th key={heading} style={styles.cell}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td style={styles.cell}>{tenant.id}</td>
                    <td style={styles.cell}>{tenant.name}</td>
                    <td style={styles.cell}>{tenant.slug}</td>
                    <td style={styles.cell}>
                      {tenant.active ? "Active" : "Inactive"}
                    </td>
                    <td style={styles.cell}>
                      {tenant.createdAt
                        ? new Date(tenant.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td style={styles.cell}>
                      <button
                        style={styles.button}
                        disabled={busyId !== null}
                        onClick={() => toggleTenant(tenant)}
                      >
                        {busyId === `tenant-${tenant.id}`
                          ? "Please wait..."
                          : tenant.active
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
