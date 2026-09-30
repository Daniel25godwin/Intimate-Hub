import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useAuth } from "../../../context/AuthContext";
import { validatePassword } from "../../../utils/authHelpers";

export default function Security() {
  const { user } = useAuth();
  const usesPassword = user?.providerData?.some((p) => p.providerId === "password");
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function change(e) {
    e.preventDefault();
    setMsg(""); setError("");
    if (f.next !== f.confirm) return setError("The new passwords don't match.");
    const problem = validatePassword(f.next);
    if (problem) return setError(problem);

    setBusy(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, f.current));
      await updatePassword(user, f.next);
      setF({ current: "", next: "", confirm: "" });
      setMsg("Your password has been changed.");
    } catch (err) {
      if (["auth/wrong-password", "auth/invalid-credential"].includes(err.code)) setError("Your current password is incorrect.");
      else if (err.code === "auth/too-many-requests") setError("Too many attempts. Please wait a few minutes and try again.");
      else setError(err.message);
    }
    setBusy(false);
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div style={{ maxWidth: 520 }}>
      <h2>Security</h2>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div><span className="muted" style={{ fontSize: 13 }}>Signed in as</span><br /><strong>{user?.email}</strong></div>
        <div>{user?.emailVerified ? <span className="pill pill-delivered">Email verified</span> : <span className="pill pill-pending">Email not verified</span>}</div>
      </div>

      {usesPassword ? (
        <form onSubmit={change} className="form">
          <div className="panel">
            <h3>Change password</h3>
            <label className="field"><span>Current password</span><input type="password" value={f.current} onChange={set("current")} autoComplete="current-password" required /></label>
            <label className="field"><span>New password</span><input type="password" value={f.next} onChange={set("next")} autoComplete="new-password" required /></label>
            <label className="field"><span>Confirm new password</span><input type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" required /></label>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {msg && <p className="notice" role="status">{msg}</p>}
          <button className="btn" disabled={busy} style={{ alignSelf: "flex-start" }}>{busy ? "Updating…" : "Update password"}</button>
        </form>
      ) : (
        <p className="muted">You sign in with a social account, so your password is managed there.</p>
      )}
    </div>
  );
}
