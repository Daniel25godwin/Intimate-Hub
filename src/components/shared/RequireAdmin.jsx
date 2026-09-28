import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// UX-level gate only. The real security boundary is Firestore/Storage rules
// checking request.auth.token.role == "admin" — this just avoids flashing
// admin UI at logged-out/non-admin users.
export default function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return children;
}
