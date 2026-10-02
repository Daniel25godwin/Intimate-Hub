import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Check, Clock } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { ensureUserProfile } from "../../services/authService";
import { sendVerificationEmail } from "../../services/emailService";
import AuthShell from "../../components/storefront/AuthShell";

// SIGN UP — STEP 2 (verify email)
export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const email = location.state?.email || user?.email || "";

  const [checking, setChecking] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [resendState, setResendState] = useState("idle"); // idle | sending | sent | error | error-rate-limited
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((sec) => sec - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendState === "sending" || resendCooldown > 0) return;
    setResendState("sending");
    try {
      await sendVerificationEmail();
      setResendState("sent");
      setResendCooldown(30);
    } catch (err) {
      // Too-many-requests means resend attempts are being rate-limited;
      // surface a friendlier message than the raw error.
      setResendState(err.code === "auth/too-many-requests" ? "error-rate-limited" : "error");
    }
  };

  let resendMessage = null;
  if (resendState === "sent") resendMessage = "Verification email sent — check your inbox.";
  else if (resendState === "error") resendMessage = "Couldn't send the email. Please try again.";
  else if (resendState === "error-rate-limited") resendMessage = "Too many attempts. Please wait a few minutes and try again.";

  // Firebase only checks the email's *shape*, never that it's deliverable. A
  // typo'd address still creates the account and lands here, but the link can
  // never arrive. Signing out and returning to sign-up gives an exit.
  const handleStartOver = async () => {
    await signOut(auth);
    navigate("/register", { replace: true });
  };

  const handleContinue = async () => {
    setVerifyError("");
    setChecking(true);
    try {
      // currentUser.emailVerified is cached — reload() re-fetches it.
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        // Security Rules / the API read the email_verified claim from the ID
        // token, which is cached separately — force a fresh one.
        await auth.currentUser.getIdToken(true);
        await ensureUserProfile(auth.currentUser);
        const token = await auth.currentUser.getIdTokenResult();
        navigate(token.claims.role === "admin" ? "/admin" : "/", { replace: true });
      } else {
        setVerifyError("Your email isn't verified yet. Please click the link we sent you, then try again.");
      }
    } catch (err) {
      setVerifyError("Something went wrong checking your verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  if (!authLoading && !user) return <Navigate to="/register" replace />;

  const linkBtn = (onClick, label, disabled) => (
    <button type="button" className="auth-link auth-linkbtn" onClick={onClick} disabled={disabled}>{label}</button>
  );

  return (
    <AuthShell>
      <div className="auth-success"><Check size={26} strokeWidth={2.5} /></div>
      <h1 className="auth-title" style={{ textAlign: "center" }}>Welcome!</h1>
      <p className="auth-sub" style={{ textAlign: "center" }}>
        Check your email and verify your account, then come back to start shopping.
      </p>

      <div className="auth-notice">
        <Clock size={16} />
        <span>Verification link sent to<br /><strong>{email || "your email"}</strong></span>
      </div>

      {verifyError && <div className="auth-error" role="alert">{verifyError}</div>}
      {resendMessage && (
        <div role="status" className={`auth-status ${resendState.startsWith("error") ? "is-error" : ""}`}>{resendMessage}</div>
      )}

      <button className="auth-primary" onClick={handleContinue} disabled={checking}>
        {checking ? "Checking..." : "I've verified — continue"}
      </button>

      <p className="auth-switch">
        Didn't receive it?{" "}
        {resendCooldown > 0
          ? <span style={{ opacity: 0.5 }}>Resend in {resendCooldown}s</span>
          : linkBtn(handleResend, resendState === "sending" ? "Sending…" : "Resend email")}
      </p>
      <p className="auth-switch" style={{ marginTop: 10 }}>
        Wrong email? {linkBtn(handleStartOver, "Sign out and start over")}
      </p>
    </AuthShell>
  );
}
