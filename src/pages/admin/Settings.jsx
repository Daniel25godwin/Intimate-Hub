import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listAdmins, promoteByEmail } from "../../services/adminAccessService";

export default function Settings() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => listAdmins().then((r) => setAdmins(r.admins || [])).catch((err) => { setAdmins([]); setError(err.message); });
  useEffect(() => { load(); }, []);

  async function addAdmin(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await promoteByEmail(email, true);
      setEmail("");
      load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  async function removeAdmin(a) {
    if (!confirm(`Remove admin access for ${a.email}?`)) return;
    setError("");
    try {
      await promoteByEmail(a.email, false);
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1>Settings</h1>

      <h3>Admin access</h3>
      <p className="muted" style={{ maxWidth: 520 }}>
        The person must already have an account (they need to sign up on the site first) before you can promote them.
        They'll need to sign out and back in for admin access to take effect.
      </p>

      <form onSubmit={addAdmin} className="row">
        <input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button disabled={busy}>{busy ? "Adding…" : "Grant admin access"}</button>
      </form>
      {error && <p className="error">{error}</p>}

      {admins === null ? <p>Loading…</p> : (
        <table className="table">
          <thead><tr><th>Email</th><th>Name</th><th></th></tr></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.uid}>
                <td>{a.email}{a.email === user?.email && <span className="muted"> (you)</span>}</td>
                <td>{a.displayName || "—"}</td>
                <td>{a.email !== user?.email && <button onClick={() => removeAdmin(a)}>Remove</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: 40 }}>Store settings</h3>
      <p className="muted">Store name, delivery fees and payment settings arrive with a later phase.</p>
    </div>
  );
}
