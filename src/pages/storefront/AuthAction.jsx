import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Eye, EyeOff } from "lucide-react";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../../firebase/config";
import { validatePassword } from "../../utils/authHelpers";
import AuthShell from "../../components/storefront/AuthShell";

// Handles the links in the verification and password-reset emails.
// Route: /auth/action?mode=verifyEmail|resetPassword&oobCode=...
export default function AuthAction() {
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  const [status, setStatus] = useState("loading"); // loading | ready | done | error
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!oobCode || !["verifyEmail", "resetPassword"].includes(mode)) {
      setStatus("error");
      setMessage("This link is invalid.");
      return;
    }

    (async () => {
      try {
        if (mode === "verifyEmail") {
          await applyActionCode(auth, oobCode);
          // If they're signed in on this browser, refresh the cached status.
          try {
            await auth.currentUser?.reload();
            await auth.currentUser?.getIdToken(true);
          } catch {
            /* not signed in here, fine */
          }
          setStatus("done");
        } else {
          await verifyPasswordResetCode(auth, oobCode);
          setStatus("ready");
        }
      } catch {
        setStatus("error");
        setMessage("This link has expired or was already used. Please request a new one.");
      }
    })();
  }, [mode, oobCode]);

  const handleReset = async (e) => {
    e.preventDefault();
    const pwdError = validatePassword(password);
    if (pwdError) {
      setMessage(pwdError);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("done");
    } catch {
      setMessage("Couldn't reset your password. The link may have expired.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <AuthShell>
        <p className="auth-sub" style={{ textAlign: "center" }}>Please wait…</p>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell>
        <h1 className="auth-title" style={{ textAlign: "center" }}>Link problem</h1>
        <div className="auth-error" role="alert">{message}</div>
        <Link to="/login" className="auth-primary auth-primary-link">Back to sign in</Link>
      </AuthShell>
    );
  }

  if (status === "done") {
    return (
      <AuthShell>
        <div className="auth-success"><Check size={26} strokeWidth={2.5} /></div>
        <h1 className="auth-title" style={{ textAlign: "center" }}>
          {mode === "verifyEmail" ? "Email verified" : "Password updated"}
        </h1>
        <p className="auth-sub" style={{ textAlign: "center" }}>
          {mode === "verifyEmail"
            ? "Your email is confirmed. You can start shopping."
            : "You can now sign in with your new password."}
        </p>
        <Link to="/login" className="auth-primary auth-primary-link">Continue</Link>
      </AuthShell>
    );
  }

  // status === "ready": password reset form
  return (
    <AuthShell>
      <h1 className="auth-title">Choose a new password</h1>
      {message && <div className="auth-error" role="alert">{message}</div>}
      <form onSubmit={handleReset} noValidate>
        <div className="auth-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="auth-eye" type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button className="auth-primary" disabled={saving}>{saving ? "Saving..." : "Update password"}</button>
      </form>
    </AuthShell>
  );
}
