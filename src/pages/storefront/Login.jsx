import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { needsVerification } from "../../services/authService";
import { useSocialSignIn } from "../../hooks/useSocialSignIn";
import { isValidEmail } from "../../utils/authHelpers";
import AuthShell from "../../components/storefront/AuthShell";
import SocialButtons from "../../components/storefront/SocialButtons";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in (or just finished signing in): leave the login screen.
  useEffect(() => {
    if (authLoading || !user) return;
    if (needsVerification(user)) navigate("/verify-email", { replace: true });
    else navigate(isAdmin ? "/admin" : from, { replace: true });
  }, [authLoading, user, isAdmin, from, navigate]);

  // Unverified email accounts go to the verify screen, admins to the
  // dashboard, customers back to where they came from.
  const routeUser = async (firebaseUser) => {
    if (needsVerification(firebaseUser)) {
      navigate("/verify-email", { replace: true, state: { email: firebaseUser.email } });
      return;
    }
    const token = await firebaseUser.getIdTokenResult();
    navigate(token.claims.role === "admin" ? "/admin" : from, { replace: true });
  };

  const social = useSocialSignIn({ setError, setLoading, routeUser });

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email");
      return;
    }
    if (password.length < 6) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      routeUser(auth.currentUser);
    } catch (err) {
      // auth/invalid-credential is what current Firebase returns for a wrong
      // email/password (the older user-not-found / wrong-password codes are
      // kept as-is).
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Email or password is incorrect");
      } else if (err.code === "auth/user-disabled") {
        setError("This account has been disabled");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Link to="/" className="auth-back"><ArrowLeft size={16} /> Back to store</Link>
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-sub">Sign in to view your orders and wishlist.</p>

      {error && <div className="auth-error" role="alert">{error}</div>}

      <form onSubmit={handleLogin} noValidate>
        <div className="auth-field">
          <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="auth-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="auth-eye" onClick={() => setShowPassword(!showPassword)} type="button" aria-label="Toggle password visibility">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="auth-forgot">
          <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
        </div>

        <button className="auth-primary" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>

      <SocialButtons handlers={social} disabled={loading} />

      <p className="auth-switch">
        Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
      </p>
    </AuthShell>
  );
}
