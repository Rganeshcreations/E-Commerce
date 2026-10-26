import { useEffect, useState } from "react";
import { Building2, RefreshCw, Send } from "lucide-react";
import { api } from "../services/api";

function makeSlug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function TenantApplicantDashboard() {
  const [applications, setApplications] = useState([]);
  const [domains, setDomains] = useState([]);
  const [applicantName, setApplicantName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [domainSlug, setDomainSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [applicationRows, domainRows] = await Promise.all([
        api.myTenantApplications(),
        api.domains()
      ]);
      setApplications(Array.isArray(applicationRows) ? applicationRows : []);
      setDomains(Array.isArray(domainRows) ? domainRows : []);
    } catch (err) {
      setError(err.message || "Could not load your application status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const hasPending = applications.some(item => item.status === "PENDING");
  const availableDomains = domains.filter(item =>
    item.available === true || (item.available == null && item.allocatedTenantId == null)
  );

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (applicantName.trim().length < 2 || storeName.trim().length < 2 || !domainSlug) {
      setError("Enter your name, store name, and choose a business domain.");
      return;
    }
    setSubmitting(true);
    try {
      await api.submitTenantApplication({
        applicantName: applicantName.trim(),
        storeName: storeName.trim(),
        requestedSlug: makeSlug(storeName),
        requestedDomainSlug: domainSlug
      });
      setMessage("Your store application has been submitted. You can continue using your account while it is reviewed.");
      setStoreName("");
      await load();
    } catch (err) {
      setError(err.message || "The application could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="content narrow">
      <div className="page-head">
        <div>
          <p className="eyebrow">STORE ONBOARDING</p>
          <h1>Tenant Applicant Dashboard</h1>
          <p>Submit a store application and track the Super Admin's decision. Store management stays locked until approval.</p>
        </div>
        <button className="secondary-btn" onClick={load} disabled={loading}>
          <RefreshCw size={17}/> Refresh
        </button>
      </div>

      {error && <div className="error-box" role="alert">{error}</div>}
      {message && <div className="info-box" role="status">{message}</div>}

      {!hasPending && (
        <section className="table-card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="table-head">
            <div><b><Building2 size={18} style={{ verticalAlign: "middle", marginRight: 8 }}/>Apply for a store</b>
              <small>Your account already exists; this form does not ask you to create another one.</small></div>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>Applicant name
              <input value={applicantName} onChange={e => setApplicantName(e.target.value)} minLength={2} maxLength={100} required />
            </label>
            <label>Store name
              <input value={storeName} onChange={e => setStoreName(e.target.value)} minLength={2} maxLength={100} required />
            </label>
            <label>Store URL slug
              <input value={makeSlug(storeName)} readOnly aria-label="Generated store URL slug" />
            </label>
            <label>Business domain
              <select value={domainSlug} onChange={e => setDomainSlug(e.target.value)} required>
                <option value="">Select a domain</option>
                {availableDomains.map(domain => <option key={domain.id ?? domain.slug} value={domain.slug}>{domain.name ?? domain.slug}</option>)}
              </select>
            </label>
            <button className="primary-btn" type="submit" disabled={submitting || loading}>
              <Send size={17}/> {submitting ? "Submitting..." : "Submit application"}
            </button>
          </form>
        </section>
      )}

      <section className="table-card" style={{ padding: 24 }}>
        <div className="table-head"><div><b>My applications</b><small>Approval and rejection decisions appear here.</small></div></div>
        {loading ? <p>Loading application status...</p> : applications.length === 0 ? (
          <p>You have not submitted a store application yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>STORE</th><th>DOMAIN</th><th>STATUS</th><th>REVIEW NOTE</th><th>SUBMITTED</th></tr></thead>
              <tbody>{applications.map(item => (
                <tr key={item.id}>
                  <td><b>{item.storeName}</b><small style={{ display: "block" }}>{item.requestedSlug}</small></td>
                  <td>{item.requestedDomainSlug}</td>
                  <td><span className={item.status === "APPROVED" ? "badge green" : item.status === "REJECTED" ? "badge red" : "badge"}>{item.status}</span></td>
                  <td>{item.reviewNote || (item.status === "PENDING" ? "Waiting for Super Admin review" : "—")}</td>
                  <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
