import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { to: "/account", label: "Overview", end: true },
  { to: "/account/orders", label: "Orders" },
  { to: "/account/wishlist", label: "Wishlist" },
  { to: "/account/addresses", label: "Addresses" },
  { to: "/account/profile", label: "Profile" },
  { to: "/account/security", label: "Security" },
];

export default function AccountLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="section"><div className="skeleton" style={{ minHeight: 200 }} /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <div className="section">
      <h1>My account</h1>
      <nav className="acct-tabs" aria-label="Account sections">
        {TABS.map((t) => <NavLink key={t.to} to={t.to} end={t.end}>{t.label}</NavLink>)}
      </nav>
      <div className="acct-body"><Outlet /></div>
    </div>
  );
}
