import { Outlet, Link } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">Intimate Hub Admin</div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </nav>
        <Link to="/" className="admin-back-to-store">← Back to store</Link>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <input placeholder="Search…" />
        </header>
        <section className="admin-content">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
