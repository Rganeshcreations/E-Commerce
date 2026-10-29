import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Layers, Plus, RefreshCw, Search, Store, Unlink, X, Building2, UserRound } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("ALL");
  const [assigningDomain, setAssigningDomain] = useState(null);
  const [selectedTenantId, setSelectedTenantId] = useState("");

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
  const availableTenants = tenants.filter((t) => !assigned.some((d) => Number(d.tenantId) === Number(t.id)));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return domains.filter((d) => {
      const matchesSearch = !q || [d.name, d.description, d.tenantName, d.tenantId, d.id]
        .some((v) => String(v ?? "").toLowerCase().includes(q));
      const matchesTab = activeTab === "ALL" ||
        (activeTab === "ASSIGNED" ? d.tenantId != null : d.tenantId == null);
      return matchesSearch && matchesTab;
    });
  }, [domains, search, activeTab]);

  async function createDomain(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.createDomain({ name: name.trim(), description: description.trim() });
      setName(""); setDescription(""); setShowForm(false);
      setNotice("Domain created successfully. It is currently unassigned.");
      await loadData();
    } catch (e) {
      setError(e?.message || "Could not create the domain.");
    } finally { setSaving(false); }
  }

  async function assignDomain(e) {
    e.preventDefault();
    if (!assigningDomain || !selectedTenantId) {
      setError("Choose a tenant to assign this domain.");
      return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      await api.assignDomain(assigningDomain.id, selectedTenantId);
      const tenant = tenants.find((t) => Number(t.id) === Number(selectedTenantId));
      setNotice(assigningDomain.name + " assigned to " + (tenant?.name || "the selected tenant") + ".");
      setAssigningDomain(null); setSelectedTenantId("");
      await loadData();
    } catch (e) {
      setError(e?.message || "Could not assign the domain.");
    } finally { setSaving(false); }
  }

  async function unassignDomain(domain) {
    if (!window.confirm("Unassign " + domain.name + " from " + (domain.tenantName || ("Tenant #" + domain.tenantId)) + "?")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.unassignDomain(domain.id);
      setNotice(domain.name + " is now available for assignment.");
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
          <p>Create domains once, then review exactly which tenant owns each domain.</p>
        </div>
        <div className="domains-heading-actions">
          <button className="domain-btn secondary" onClick={loadData} disabled={loading}><RefreshCw size={16}/> Refresh</button>
          <button className="domain-btn primary" onClick={() => setShowForm((v) => !v)}><Plus size={17}/> Create domain</button>
        </div>
      </header>

      {error && <div className="domain-notice error" role="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={16}/></button></div>}
      {notice && <div className="domain-notice success" role="status"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}

      {showForm && <form className="domain-form" onSubmit={createDomain}>
        <div className="domain-form-title"><div><h2>Create a domain</h2><p>Add a marketplace category such as Medicines, Vegetables, Fruits, Groceries or Electronics.</p></div><button type="button" className="domain-icon-btn" onClick={() => setShowForm(false)} aria-label="Close form"><X size={18}/></button></div>
        <div className="domain-form-fields">
          <label>Domain name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. Medicines" required /></label>
          <label>Description <span>(optional)</span><input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What does this domain cover?" /></label>
        </div>
        <button className="domain-btn primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save domain"}</button>
      </form>}

      <section className="domain-stats">
        <article><span className="domain-stat-icon blue"><Layers size={20}/></span><p>All domains</p><strong>{domains.length}</strong><small>In the domain catalogue</small></article>
        <article><span className="domain-stat-icon green"><CheckCircle2 size={20}/></span><p>Assigned</p><strong>{assigned.length}</strong><small>Tenant name shown below</small></article>
        <article><span className="domain-stat-icon amber"><Store size={20}/></span><p>Unassigned</p><strong>{unassigned.length}</strong><small>Available to allocate</small></article>
        <article><span className="domain-stat-icon purple"><Building2 size={20}/></span><p>Tenants without a domain</p><strong>{availableTenants.length}</strong><small>Can receive an available domain</small></article>
      </section>

      <section className="domain-panel">
        <div className="domain-panel-heading">
          <div><h2>Domain catalogue</h2><p>All domains appear here. Assigned domains show their tenant; unassigned domains can be allocated from the action.</p></div>
          <label className="domain-search"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search domain or tenant..."/></label>
        </div>
        <div className="domain-tabs" role="tablist" aria-label="Filter domains">
          <button className={activeTab === "ALL" ? "active" : ""} onClick={() => setActiveTab("ALL")}>All domains <span>{domains.length}</span></button>
          <button className={activeTab === "ASSIGNED" ? "active" : ""} onClick={() => setActiveTab("ASSIGNED")}>Assigned <span>{assigned.length}</span></button>
          <button className={activeTab === "UNASSIGNED" ? "active" : ""} onClick={() => setActiveTab("UNASSIGNED")}>Unassigned <span>{unassigned.length}</span></button>
        </div>
        {loading ? <div className="domain-empty">Loading domain records…</div> : filtered.length === 0 ? <div className="domain-empty">{domains.length === 0 ? "No domains have been created yet. Use Create domain to build the catalogue." : "No domains match this filter or search."}</div> :
          <div className="domain-table-wrap"><table className="domain-table"><thead><tr><th>DOMAIN</th><th>DESCRIPTION</th><th>STATUS</th><th>ASSIGNED TENANT</th><th>ACTION</th></tr></thead><tbody>
            {filtered.map((domain) => <tr key={domain.id}>
              <td><div className="domain-name-cell"><span className="domain-row-icon"><Layers size={18}/></span><div><strong>{domain.name}</strong><small>Domain #{domain.id}</small></div></div></td>
              <td>{domain.description || "—"}</td>
              <td><span className={"domain-pill " + (domain.tenantId != null ? "assigned" : "available")}>{domain.tenantId != null ? "Assigned" : "Unassigned"}</span></td>
              <td>{domain.tenantId != null ? <div className="domain-tenant"><strong><Store size={14}/> {domain.tenantName || ("Tenant #" + domain.tenantId)}</strong><small>Tenant ID: {domain.tenantId}</small></div> : <span className="domain-unassigned-note">Not allocated to any tenant</span>}</td>
              <td>{domain.tenantId != null ? <button className="domain-btn secondary small" onClick={() => unassignDomain(domain)} disabled={saving}><Unlink size={14}/> Unassign</button> : <button className="domain-btn primary small" onClick={() => { setAssigningDomain(domain); setSelectedTenantId(""); setError(""); }} disabled={saving || availableTenants.length === 0}><Store size={14}/> Assign tenant</button>}</td>
            </tr>)}
          </tbody></table></div>}
      </section>
      <p className="domain-footnote">Assignment rule: one domain per tenant and one tenant per domain. Use the Assigned filter to review existing ownership and Unassigned to see what is still available.</p>

      {assigningDomain && <div className="domain-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setAssigningDomain(null); }}>
        <form className="domain-assign-modal" onSubmit={assignDomain}>
          <div className="domain-form-title"><div><p className="domains-eyebrow"><UserRound size={14}/> DOMAIN ALLOCATION</p><h2>Assign {assigningDomain.name}</h2><p>Select a tenant that does not already have a domain.</p></div><button type="button" className="domain-icon-btn" onClick={() => setAssigningDomain(null)} aria-label="Close dialog"><X size={18}/></button></div>
          <label className="domain-assign-label">Tenant<select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} required><option value="">Choose a tenant…</option>{availableTenants.map((t) => <option key={t.id} value={t.id}>{t.name} · Tenant #{t.id}</option>)}</select></label>
          {availableTenants.length === 0 && <p className="domain-modal-help">Every registered tenant already has a domain. Unassign a domain first if you need to move one.</p>}
          <div className="domain-modal-actions"><button type="button" className="domain-btn secondary" onClick={() => setAssigningDomain(null)} disabled={saving}>Cancel</button><button type="submit" className="domain-btn primary" disabled={saving || !selectedTenantId}>{saving ? "Assigning…" : "Confirm assignment"}</button></div>
        </form>
      </div>}
    </main>
  );
}
