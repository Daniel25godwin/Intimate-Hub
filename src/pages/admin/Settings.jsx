import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listAdmins, promoteByEmail } from "../../services/adminAccessService";
import { getBankSettings, saveBankSettings } from "../../services/settingsService";

export default function Settings() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [bank, setBank] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [bankMsg, setBankMsg] = useState("");
  const [bankBusy, setBankBusy] = useState(false);
  useEffect(() => { getBankSettings().then((b) => setBank((cur) => ({ ...cur, ...b }))).catch(() => {}); }, []);

  async function saveBank(e) {
    e.preventDefault();
    setBankBusy(true); setBankMsg("");
    try {
      if (!/^\d{10}$/.test(bank.accountNumber.replace(/\s+/g, ""))) throw new Error("Account number should be 10 digits.");
      await saveBankSettings(bank);
      setBankMsg("Saved. New orders will show these details.");
    } catch (err) { setBankMsg(err.message); }
    setBankBusy(false);
  }
  const setB = (k) => (e) => setBank({ ...bank, [k]: e.target.value });

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

      <h3>Bank account</h3>
      <p className="muted" style={{ maxWidth: 520 }}>
        Customers are told to transfer to this account. Orders already placed keep the account they were given.
      </p>
      <form onSubmit={saveBank} className="form" style={{ maxWidth: 420, marginBottom: 32 }}>
        <label className="field"><span>Bank name</span><input value={bank.bankName} onChange={setB("bankName")} placeholder="Moniepoint" required /></label>
        <label className="field"><span>Account number</span><input value={bank.accountNumber} onChange={setB("accountNumber")} inputMode="numeric" maxLength={10} placeholder="10 digits" required /></label>
        <label className="field"><span>Account name</span><input value={bank.accountName} onChange={setB("accountName")} required /></label>
        <button disabled={bankBusy}>{bankBusy ? "Saving…" : "Save bank account"}</button>
        {bankMsg && <p role="status">{bankMsg}</p>}
      </form>

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

    </div>
  );
}
