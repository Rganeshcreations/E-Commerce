import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Building2, Check, CheckCircle2, Clock3, Eye, Filter,
  Mail, Power, RefreshCw, Search, ShieldCheck, Store, X
} from "lucide-react";
import { api } from "../services/api";
import "./Tenants.css";

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusPill({ active }) {
  return (
    <span className={"tenant-status " + (active ? "is-active" : "is-inactive")}>
      <span className="tenant-status-dot" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Notice({ type = "error", children, onDismiss }) {
  if (!children) return null;
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={"tenant-notice " + type} role={type === "error" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
      {onDismiss && (
        <button type="button" className="tenant-notice-close" aria-label="Dismiss message" onClick={onDismiss}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="tenant-loading" aria-label="Loading tenants">
      <span /><span /><span />
      <p>Loading your latest data…</p>
    </div>
  );
}

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [tenantError, setTenantError] = useState("");
  const [applicationError, setApplicationError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [rejectingApplication, setRejectingApplication] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadTenants = useCallback(async () => {
    setLoadingTenants(true);
    setTenantError("");
    try {
      setTenants(asList(await api.tenants()));
    } catch (error) {
      setTenantError(error?.message || "We couldn't load registered tenants.");
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoadingApplications(true);
    setApplicationError("");
    try {
      setApplications(asList(await api.pendingTenantApplications()));
    } catch (error) {
      setApplicationError(error?.message || "We couldn't load pending applications.");
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setMessage("");
    await Promise.all([loadTenants(), loadApplications()]);
  }, [loadTenants, loadApplications]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const activeCount = tenants.filter((tenant) => Boolean(tenant.active)).length;
  const inactiveCount = tenants.length - activeCount;

  const filteredTenants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const matchesSearch = !term || [
        tenant.name, tenant.slug, tenant.id, tenant.domainName, tenant.domain
      ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? Boolean(tenant.active) : !tenant.active);
      return matchesSearch && matchesStatus;
    });
  }, [tenants, search, statusFilter]);

  async function approveApplication(application) {
    const confirmed = window.confirm(
      "Approve \"" + (application.storeName || "this store") + "\" and create its tenant?"
    );
    if (!confirmed) return;

    setBusyId("application-" + application.id);
    setMessage("");
    setApplicationError("");
    try {
      await api.approveTenantApplication(application.id);
      setMessage("Application #" + application.id + " approved. The tenant has been created.");
      setRejectingApplication(null);
      await Promise.all([loadTenants(), loadApplications()]);
    } catch (error) {
      setApplicationError(error?.message || "We couldn't approve this application.");
    } finally {
      setBusyId(null);
    }
  }

  async function rejectApplication(event) {
    event.preventDefault();
    if (!rejectingApplication) return;
    if (!rejectionReason.trim()) {
      setApplicationError("Add a short reason before rejecting this application.");
      return;
    }

    const applicationId = rejectingApplication.id;
    setBusyId("application-" + applicationId);
    setMessage("");
    setApplicationError("");
    try {
      await api.rejectTenantApplication(applicationId, rejectionReason.trim());
      setMessage("Application #" + applicationId + " has been rejected.");
      setRejectingApplication(null);
      setRejectionReason("");
      await loadApplications();
    } catch (error) {
      setApplicationError(error?.message || "We couldn't reject this application.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleTenant(tenant) {
    const action = tenant.active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      "Are you sure you want to " + action + " \"" + (tenant.name || "this tenant") + "\"?"
    );
    if (!confirmed) return;

    setBusyId("tenant-" + tenant.id);
    setMessage("");
    setTenantError("");
    try {
      await api.setTenantActive(tenant.id, !tenant.active);
      setMessage("Tenant \"" + (tenant.name || tenant.id) + "\" is now " + (tenant.active ? "inactive." : "active."));
      await loadTenants();
    } catch (error) {
      setTenantError(error?.message || "We couldn't update this tenant's status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="tenants-page">
      <div className="tenants-page-header">
        <div>
          <div className="tenants-eyebrow"><ShieldCheck size={15} /> PLATFORM ADMINISTRATION</div>
          <h1>Tenant management</h1>
          <p>Review new store applications and manage the stores on your marketplace.</p>
        </div>
        <button type="button" className="tenant-button secondary" onClick={refreshAll}
          disabled={loadingTenants || loadingApplications || busyId !== null}>
          <RefreshCw size={16} className={(loadingTenants || loadingApplications) ? "tenant-spin" : ""} />
          Refresh data
        </button>
      </div>

      <Notice type="success" onDismiss={() => setMessage("")}>{message}</Notice>

      <section className="tenant-stat-grid" aria-label="Tenant summary">
        <article className="tenant-stat-card">
          <div className="tenant-stat-icon blue"><Store size={20} /></div>
          <div className="tenant-stat-label">Registered tenants</div>
          <div className="tenant-stat-value">{loadingTenants ? "—" : tenantError ? "—" : tenants.length}</div>
          <div className="tenant-stat-note">Stores on the platform</div>
        </article>
        <article className="tenant-stat-card">
          <div className="tenant-stat-icon green"><CheckCircle2 size={20} /></div>
          <div className="tenant-stat-label">Active tenants</div>
          <div className="tenant-stat-value">{loadingTenants ? "—" : tenantError ? "—" : activeCount}</div>
          <div className="tenant-stat-note">Currently enabled</div>
        </article>
        <article className="tenant-stat-card">
          <div className="tenant-stat-icon amber"><Power size={20} /></div>
          <div className="tenant-stat-label">Inactive tenants</div>
          <div className="tenant-stat-value">{loadingTenants ? "—" : tenantError ? "—" : inactiveCount}</div>
          <div className="tenant-stat-note">Currently disabled</div>
        </article>
        <article className="tenant-stat-card">
          <div className="tenant-stat-icon violet"><Clock3 size={20} /></div>
          <div className="tenant-stat-label">Pending applications</div>
          <div className="tenant-stat-value">{loadingApplications ? "—" : applicationError ? "—" : applications.length}</div>
          <div className="tenant-stat-note">Awaiting your review</div>
        </article>
      </section>

      <section className="tenant-panel">
        <div className="tenant-panel-header">
          <div>
            <div className="tenant-section-title-row">
              <h2>Applications to review</h2>
              {!loadingApplications && !applicationError && <span className="tenant-count">{applications.length}</span>}
            </div>
            <p>Approve a suitable application to create its tenant, or reject it with a reason.</p>
          </div>
          <span className="tenant-section-icon amber"><Clock3 size={19} /></span>
        </div>

        <Notice>{applicationError}</Notice>

        {loadingApplications ? <LoadingRows /> : applicationError ? (
          <div className="tenant-empty">
            <AlertCircle size={25} />
            <h3>Applications couldn't be loaded</h3>
            <p>Check your admin session and service connection, then try again.</p>
            <button type="button" className="tenant-button secondary" onClick={loadApplications}>
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="tenant-empty">
            <div className="tenant-empty-icon"><Check size={24} /></div>
            <h3>You're all caught up</h3>
            <p>There are no pending tenant applications right now.</p>
          </div>
        ) : (
          <div className="tenant-table-wrap">
            <table className="tenant-table applications-table">
              <thead><tr>
                <th>Applicant / email</th><th>Store name</th><th>Requested slug</th><th>Submitted</th><th className="tenant-actions-heading">Review</th>
              </tr></thead>
              <tbody>
                {applications.map((application) => {
                  const busy = busyId === "application-" + application.id;
                  return (
                    <tr key={application.id}>
                      <td>
                        <div className="tenant-person">
                          <div className="tenant-avatar">{String(application.applicantName || "A").trim().charAt(0).toUpperCase()}</div>
                          <div className="tenant-cell-stack">
                            <strong>{application.applicantName || "Applicant"}</strong>
                            <span><Mail size={13} /> {application.applicantEmail || "Email not provided"}</span>
                          </div>
                        </div>
                      </td>
                      <td><strong className="tenant-primary-text">{application.storeName || "Unnamed store"}</strong></td>
                      <td><code className="tenant-slug">{application.requestedSlug || "—"}</code></td>
                      <td className="tenant-muted">{displayDate(application.submittedAt)}</td>
                      <td>
                        <div className="tenant-row-actions">
                          <button type="button" className="tenant-button approve" disabled={busyId !== null}
                            onClick={() => approveApplication(application)}>
                            <Check size={15} /> {busy ? "Working…" : "Approve"}
                          </button>
                          <button type="button" className="tenant-button reject" disabled={busyId !== null}
                            onClick={() => { setApplicationError(""); setRejectingApplication(application); setRejectionReason(""); }}>
                            <X size={15} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="tenant-panel">
        <div className="tenant-panel-header tenant-registered-header">
          <div>
            <div className="tenant-section-title-row">
              <h2>Registered tenants</h2>
              {!loadingTenants && !tenantError && <span className="tenant-count">{filteredTenants.length}{filteredTenants.length !== tenants.length ? " of " + tenants.length : ""}</span>}
            </div>
            <p>Search stores and manage whether each tenant can operate.</p>
          </div>
          <span className="tenant-section-icon blue"><Building2 size={19} /></span>
        </div>

        <div className="tenant-toolbar">
          <label className="tenant-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Search store name, slug or ID…" aria-label="Search tenants" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
          </label>
          <label className="tenant-filter">
            <Filter size={16} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter tenant status">
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </div>

        <Notice>{tenantError}</Notice>

        {loadingTenants ? <LoadingRows /> : tenantError ? (
          <div className="tenant-empty">
            <AlertCircle size={25} />
            <h3>Tenant list couldn't be loaded</h3>
            <p>The list is unavailable, so no tenant counts are shown as final.</p>
            <button type="button" className="tenant-button secondary" onClick={loadTenants}>
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="tenant-empty">
            <Search size={25} />
            <h3>{tenants.length ? "No matching tenants" : "No tenants registered yet"}</h3>
            <p>{tenants.length ? "Try another search or change the status filter." : "Approved tenant applications will appear here."}</p>
            {tenants.length > 0 && <button type="button" className="tenant-button secondary" onClick={() => { setSearch(""); setStatusFilter("ALL"); }}>Clear filters</button>}
          </div>
        ) : (
          <div className="tenant-table-wrap">
            <table className="tenant-table">
              <thead><tr><th>Store</th><th>Tenant ID</th><th>Slug</th><th>Created</th><th>Status</th><th className="tenant-actions-heading">Action</th></tr></thead>
              <tbody>
                {filteredTenants.map((tenant) => {
                  const busy = busyId === "tenant-" + tenant.id;
                  return (
                    <tr key={tenant.id}>
                      <td>
                        <div className="tenant-person">
                          <div className="tenant-avatar store-avatar"><Store size={17} /></div>
                          <div className="tenant-cell-stack">
                            <strong>{tenant.name || "Unnamed store"}</strong>
                            <span>{tenant.domainName || tenant.domain || "Marketplace tenant"}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="tenant-id">#{tenant.id}</span></td>
                      <td><code className="tenant-slug">{tenant.slug || "—"}</code></td>
                      <td className="tenant-muted">{displayDate(tenant.createdAt)}</td>
                      <td><StatusPill active={Boolean(tenant.active)} /></td>
                      <td>
                        <button type="button" className={"tenant-button " + (tenant.active ? "reject" : "approve")}
                          disabled={busyId !== null} onClick={() => toggleTenant(tenant)}>
                          <Power size={15} /> {busy ? "Updating…" : tenant.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loadingTenants && !tenantError && tenants.length > 0 && (
          <div className="tenant-panel-footer">
            Showing <strong>{filteredTenants.length}</strong> of <strong>{tenants.length}</strong> tenants
          </div>
        )}
      </section>

      {rejectingApplication && (
        <div className="tenant-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && busyId === null) {
            setRejectingApplication(null);
            setRejectionReason("");
          }
        }}>
          <section className="tenant-modal" role="dialog" aria-modal="true" aria-labelledby="tenant-reject-title">
            <div className="tenant-modal-icon"><AlertCircle size={22} /></div>
            <button type="button" className="tenant-modal-close" aria-label="Close dialog" disabled={busyId !== null}
              onClick={() => { setRejectingApplication(null); setRejectionReason(""); }}><X size={18} /></button>
            <h2 id="tenant-reject-title">Reject application</h2>
            <p>You're rejecting <strong>{rejectingApplication.storeName || "this store application"}</strong>. Add a clear reason so the decision is documented.</p>
            <form onSubmit={rejectApplication}>
              <label className="tenant-reason-label" htmlFor="tenant-rejection-reason">Reason for rejection</label>
              <textarea id="tenant-rejection-reason" value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)} rows={4} maxLength={1000}
                placeholder="For example, required store details are missing…" required />
              <div className="tenant-character-count">{rejectionReason.length}/1000 characters</div>
              {applicationError && <div className="tenant-inline-error" role="alert">{applicationError}</div>}
              <div className="tenant-modal-actions">
                <button type="button" className="tenant-button secondary" disabled={busyId !== null}
                  onClick={() => { setRejectingApplication(null); setRejectionReason(""); }}>Cancel</button>
                <button type="submit" className="tenant-button reject" disabled={busyId !== null || !rejectionReason.trim()}>
                  <X size={15} /> {busyId === "application-" + rejectingApplication.id ? "Rejecting…" : "Confirm rejection"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
