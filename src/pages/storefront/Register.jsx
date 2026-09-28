import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebase/config";
import { ensureUserProfile } from "../../services/authService";
import { useSocialSignIn } from "../../hooks/useSocialSignIn";
import { isValidEmail, validatePassword, strengthMeta } from "../../utils/authHelpers";
import AuthShell from "../../components/storefront/AuthShell";
import SocialButtons from "../../components/storefront/SocialButtons";
import LegalModal from "../../components/storefront/LegalModal";

// SIGN UP — STEP 1 (email & password). Step 2 is /verify-email.
export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null); // 'terms' | 'privacy' | null

  // Provider accounts are already verified: straight to the store (or the
  // dashboard for admins) — no "check your email" step.
  const routeUser = async (firebaseUser) => {
    const token = await firebaseUser.getIdTokenResult();
    navigate(token.claims.role === "admin" ? "/admin" : "/", { replace: true });
  };

  const social = useSocialSignIn({ setError, setLoading, routeUser });

  const handleSignUp = async (e) => {
    e?.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (!termsAccepted) {
      setError("Please confirm you're 18 or older and accept the terms and privacy policy");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      // Best-effort: also re-checked when they finish verifying.
      ensureUserProfile(userCredential.user).catch(console.error);
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Try logging in.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const meta = strengthMeta(password);

  return (
    <AuthShell>
      <Link to="/login" className="auth-back"><ArrowLeft size={16} /> Back</Link>
      <h1 className="auth-title">Create account</h1>
      <p className="auth-sub">Private by default. Track orders and save your favourites.</p>

      {error && <div className="auth-error" role="alert">{error}</div>}

      <form onSubmit={handleSignUp} noValidate>
        <div className="auth-field">
          <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="auth-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="auth-eye" onClick={() => setShowPassword(!showPassword)} type="button" aria-label="Toggle password visibility">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {password && (
          <div className="auth-strength" data-level={meta?.level}>
            <div className="auth-strength-bars">
              {[1, 2, 3].map((i) => <span key={i} className={i <= (meta?.level || 0) ? "on" : ""} />)}
            </div>
            <span className="auth-strength-label">{meta?.label}</span>
          </div>
        )}

        <div className="auth-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <label className="auth-check">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
          <span>
            I'm 18 or older and I agree to the{" "}
            <button type="button" className="auth-link auth-linkbtn" onClick={() => setLegalDoc("terms")}>Terms of Service</button>{" "}
            and{" "}
            <button type="button" className="auth-link auth-linkbtn" onClick={() => setLegalDoc("privacy")}>Privacy Policy</button>
          </span>
        </label>

        <button className="auth-primary" disabled={loading}>{loading ? "Creating account..." : "Continue"}</button>
      </form>

      <SocialButtons handlers={social} disabled={loading} />

      <p className="auth-switch">
        Already have an account? <Link to="/login" className="auth-link">Log in</Link>
      </p>

      <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />
    </AuthShell>
  );
}
