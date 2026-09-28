import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import AuthShell from "../../components/storefront/AuthShell";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (value) => EMAIL_REGEX.test(value.trim());

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async (e) => {
    e?.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <div className="auth-success"><Check size={26} strokeWidth={2.5} /></div>
        <h1 className="auth-title" style={{ textAlign: "center" }}>Check your email</h1>
        <p className="auth-sub" style={{ textAlign: "center" }}>
          We've sent a password reset link. Click it to create a new password.
        </p>
        <Link to="/login" className="auth-primary auth-primary-link">Back to sign in</Link>
        <p className="auth-switch">
          Didn't receive it?{" "}
          <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setSent(false); }}>Try again</a>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Link to="/login" className="auth-back"><ArrowLeft size={16} /> Back</Link>
      <h1 className="auth-title">Reset password</h1>
      <p className="auth-sub">Enter your email and we'll send a reset link.</p>

      {error && <div className="auth-error" role="alert">{error}</div>}

      <form onSubmit={handleSendReset} noValidate>
        <div className="auth-field">
          <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="auth-primary" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</button>
      </form>
    </AuthShell>
  );
}
