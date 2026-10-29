import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Layers, Plus, RefreshCw, Search, Store, Unlink, X } from "lucide-react";
import { api } from "../services/api";
import "./Domains.css";

function listOf(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  return [];
}

export default function DomainsPage() {
  const [domains, setDomains] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignments, setAssignments] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [domainData, tenantData] = await Promise.all([api.domains(), api.tenants()]);
      setDomains(listOf(domainData));
      setTenants(listOf(tenantData));
    } catch (e) {
      setError(e?.message || "Could not load domain information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const assigned = domains.filter((d) => d.tenantId != null);
  const unassigned = domains.filter((d) => d.tenantId == null);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return domains.filter((d) =>
      !q || [d.name, d.description, d.tenantName, d.tenantId, d.id]
        .some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [domains, search]);

  async function createDomain(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.createDomain({ name: name.trim(), description: description.trim() });
      setName(""); setDescription(""); setShowForm(false);
      setNotice("Domain created successfully.");
      await loadData();
    } catch (e) {
      setError(e?.message || "Could not create the domain.");
    } finally { setSaving(false); }
  }

  async function assignDomain(domain) {
    const tenantId = assignments[domain.id];
    if (!tenantId) { setError("Select a tenant before assigning this domain."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      await api.assignDomain(domain.id, tenantId);
      setNotice(domain.name + " assigned successfully.");
      await loadData();
    } catch (e) {
      setError(e?.message || "Could not assign the domain.");
    } finally { setSaving(false); }
  }

  async function unassignDomain(domain) {
    if (!window.confirm("Unassign " + domain.name + " from " + (domain.tenantName || "its tenant") + "?")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.unassignDomain(domain.id);
      setNotice(domain.name + " is now unassigned.");
      await loadData();
    } catch (e) {
      setError(e?.message || "Could not unassign the domain.");
    } finally { setSaving(false); }
  }

  return (
    <main className="domains-page">
      <header className="domains-heading">
        <div>
          <p className="domains-eyebrow"><Layers size={15}/> PLATFORM CONFIGURATION</p>
          <h1>Domain management</h1>
          <p>Create business domains and assign one domain to each tenant.</p>
        </div>
        <div className="domains-heading-actions">
          <button className="domain-btn secondary" onClick={loadData} disabled={loading}><RefreshCw size={16}/> Refresh</button>
          <button className="domain-btn primary" onClick={() => setShowForm((v) => !v)}><Plus size={17}/> Create domain</button>
        </div>
      </header>

      {error && <div className="domain-notice error" role="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={16}/></button></div>}
      {notice && <div className="domain-notice success" role="status"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}

      {showForm && <form className="domain-form" onSubmit={createDomain}>
        <div className="domain-form-title"><div><h2>Create a domain</h2><p>Example: Medicines, Vegetables, Fruits, Groceries or Electronics.</p></div><button type="button" className="domain-icon-btn" onClick={() => setShowForm(false)} aria-label="Close form"><X size={18}/></button></div>
        <div className="domain-form-fields">
          <label>Domain name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. Medicines" required /></label>
          <label>Description <span>(optional)</span><input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="Products or services in this domain" /></label>
        </div>
        <button className="domain-btn primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save domain"}</button>
      </form>}

      <section className="domain-stats">
        <article><span className="domain-stat-icon blue"><Layers size={20}/></span><p>Total domains</p><strong>{domains.length}</strong><small>Created on the platform</small></article>
        <article><span className="domain-stat-icon green"><CheckCircle2 size={20}/></span><p>Assigned domains</p><strong>{assigned.length}</strong><small>Linked to a tenant</small></article>
        <article><span className="domain-stat-icon amber"><Store size={20}/></span><p>Unassigned domains</p><strong>{unassigned.length}</strong><small>Available for allocation</small></article>
        <article><span className="domain-stat-icon purple"><Store size={20}/></span><p>Tenants</p><strong>{tenants.length}</strong><small>Registered stores</small></article>
      </section>

      <section className="domain-panel">
        <div className="domain-panel-heading"><div><h2>All domains</h2><p>Review availability, assignment and tenant details.</p></div><label className="domain-search"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search domain or tenant..."/></label></div>
        {loading ? <div className="domain-empty">Loading domain records…</div> : filtered.length === 0 ? <div className="domain-empty">{domains.length === 0 ? "No domains have been created yet. Select Create domain to add the first one." : "No domains match your search."}</div> :
          <div className="domain-table-wrap"><table className="domain-table"><thead><tr><th>DOMAIN</th><th>DESCRIPTION</th><th>ASSIGNMENT</th><th>TENANT</th><th>ACTIONS</th></tr></thead><tbody>
            {filtered.map((domain) => <tr key={domain.id}>
              <td><div className="domain-name-cell"><span className="domain-row-icon"><Layers size={18}/></span><div><strong>{domain.name}</strong><small>Domain #{domain.id}</small></div></div></td>
              <td>{domain.description || "—"}</td>
              <td><span className={"domain-pill " + (domain.tenantId != null ? "assigned" : "available")}>{domain.tenantId != null ? "Assigned" : "Unassigned"}</span></td>
              <td>{domain.tenantId != null ? <div className="domain-tenant"><strong>{domain.tenantName || "Tenant " + domain.tenantId}</strong><small>Tenant ID: {domain.tenantId}</small></div> : <select aria-label={"Assign " + domain.name} value={assignments[domain.id] || ""} onChange={(e) => setAssignments((old) => ({...old, [domain.id]: e.target.value}))}><option value="">Select tenant…</option>{tenants.map((t) => <option key={t.id} value={t.id}>{t.name} (#{t.id})</option>)}</select>}</td>
              <td>{domain.tenantId != null ? <button className="domain-btn secondary small" onClick={() => unassignDomain(domain)} disabled={saving}><Unlink size={14}/> Unassign</button> : <button className="domain-btn primary small" onClick={() => assignDomain(domain)} disabled={saving || tenants.length === 0}><Store size={14}/> Assign</button>}</td>
            </tr>)}
          </tbody></table></div>}
      </section>
      <p className="domain-footnote">Rule: each tenant can have one domain, and a domain can be assigned to only one tenant. Domain assignments are stored by the Tenant Service.</p>
    </main>
  );
}
