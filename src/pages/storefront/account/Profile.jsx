import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getProfile, saveProfile } from "../../../services/accountService";

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getProfile(user.uid)
      .then((p) => setForm({ displayName: p.displayName || user.displayName || "", phone: p.phone || "" }))
      .catch(() => setForm({ displayName: user.displayName || "", phone: "" }));
  }, [user]);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMsg(""); setError("");
    try {
      await saveProfile(user.uid, { displayName: form.displayName.trim(), phone: form.phone.trim() });
      setMsg("Your details have been saved.");
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  if (!form) return <div className="skeleton" style={{ minHeight: 200 }} />;

  return (
    <form onSubmit={save} className="form" style={{ maxWidth: 520 }}>
      <h2>Profile</h2>
      <div className="panel">
        <label className="field"><span>Full name</span>
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} autoComplete="name" />
        </label>
        <label className="field"><span>Phone</span>
          <input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
        </label>
        <label className="field"><span>Email {user.emailVerified && <em className="verified">Verified</em>}</span>
          <input value={user.email || ""} disabled />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {msg && <p className="notice" role="status">{msg}</p>}
      <button className="btn" disabled={saving} style={{ alignSelf: "flex-start" }}>{saving ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
