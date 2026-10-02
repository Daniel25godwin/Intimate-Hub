import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BRAND } from "../config/brand";
import "./admin.css";

const NAV = [
  { group: "Overview", items: [{ to: "/admin", label: "Dashboard", end: true }] },
  {
    group: "Sales",
    items: [
      { to: "/admin/orders", label: "Orders" },
      { to: "/admin/customers", label: "Customers" },
      { to: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    group: "Catalog",
    items: [
      { to: "/admin/products", label: "Products" },
      { to: "/admin/categories", label: "Categories" },
      { to: "/admin/inventory", label: "Inventory" },
      { to: "/admin/reviews", label: "Reviews" },
    ],
  },
  {
    group: "Store",
    items: [
      { to: "/admin/analytics", label: "Analytics" },
      { to: "/admin/settings", label: "Settings" },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // close the drawer after navigating
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="admin">
      <aside className={`a-sidebar ${open ? "is-open" : ""}`} aria-label="Admin navigation">
        <div className="a-brand">
          {BRAND.logo && <img src={BRAND.logo} alt={BRAND.name} style={{ height: 34, width: "auto", display: "block", marginBottom: 6 }} />}
          Admin
        </div>
        <nav className="a-nav">
          {NAV.map((g) => (
            <div key={g.group} className="a-nav-group">
              <span className="a-nav-label">{g.group}</span>
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} className="a-nav-link">
                  {i.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="a-side-foot">
          <Link to="/" className="a-nav-link">← Back to store</Link>
        </div>
      </aside>
      {open && <div className="a-scrim" onClick={() => setOpen(false)} />}

      <div className="a-main">
        <header className="a-topbar">
          <button className="a-burger" onClick={() => setOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <input className="a-search" type="search" placeholder="Search…" />
          <div className="a-user">
            <span className="a-user-email">{user?.email}</span>
            {logout && <button className="btn-ghost" onClick={logout}>Sign out</button>}
          </div>
        </header>
        <main className="a-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
