import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getProfile, listAddresses, saveAddress, deleteAddress, setDefaultAddress } from "../../../services/accountService";

const BLANK = { recipientName: "", phone: "", street: "", city: "", state: "" };

export default function Addresses() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [defaultId, setDefaultId] = useState(null);
  const [editing, setEditing] = useState(null); // null | { id?, ...fields }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [list, profile] = await Promise.all([listAddresses(user.uid), getProfile(user.uid)]);
      setItems(list); setDefaultId(profile.defaultAddressId || null);
    } catch (err) { setError(err.message); setItems([]); }
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { id, ...data } = editing;
      const savedId = await saveAddress(user.uid, id, data);
      if (!defaultId && !id) await setDefaultAddress(user.uid, savedId); // first address becomes the default
      setEditing(null);
      await load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  async function remove(a) {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddress(user.uid, a.id);
      if (defaultId === a.id) await setDefaultAddress(user.uid, null);
      await load();
    } catch (err) { setError(err.message); }
  }

  async function makeDefault(a) {
    try { await setDefaultAddress(user.uid, a.id); setDefaultId(a.id); } catch (err) { setError(err.message); }
  }

  if (items === null) return <div className="skeleton" style={{ minHeight: 160 }} />;
  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  if (editing) {
    return (
      <form onSubmit={save} className="form" style={{ maxWidth: 520 }}>
        <h2>{editing.id ? "Edit address" : "New address"}</h2>
        <div className="panel">
          <label className="field"><span>Recipient name</span><input value={editing.recipientName} onChange={set("recipientName")} required autoComplete="name" /></label>
          <label className="field"><span>Phone</span><input type="tel" inputMode="tel" value={editing.phone} onChange={set("phone")} required autoComplete="tel" /></label>
          <label className="field"><span>Street address</span><input value={editing.street} onChange={set("street")} required autoComplete="street-address" /></label>
          <div className="row" style={{ marginBottom: 0 }}>
            <label className="field"><span>City</span><input value={editing.city} onChange={set("city")} required /></label>
            <label className="field"><span>State</span><input value={editing.state} onChange={set("state")} required /></label>
          </div>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save address"}</button>
          <button type="button" className="btn btn-outline" onClick={() => { setEditing(null); setError(""); }}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="sec-head"><h2>Addresses</h2><button className="btn" onClick={() => setEditing({ ...BLANK })}>Add address</button></div>
      {error && <p className="error" role="alert">{error}</p>}
      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><MapPin size={26} /></div>
          <h2>No saved addresses</h2>
          <p className="muted">Save an address once and we'll fill it in at checkout.</p>
        </div>
      ) : (
        <div className="acct-grid">
          {items.map((a) => (
            <div key={a.id} className="panel addr">
              {defaultId === a.id && <span className="pill pill-delivered" style={{ alignSelf: "flex-start" }}>Default</span>}
              <div>
                <strong>{a.recipientName}</strong><br />
                {a.phone}<br />{a.street}<br />{a.city}, {a.state}
              </div>
              <div className="row" style={{ marginBottom: 0 }}>
                <button className="link-btn" onClick={() => setEditing(a)}>Edit</button>
                {defaultId !== a.id && <button className="link-btn" onClick={() => makeDefault(a)}>Make default</button>}
                <button className="link-btn" style={{ color: "var(--danger)" }} onClick={() => remove(a)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
