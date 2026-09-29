import { Link } from "react-router-dom";

// Quick-access links so the dashboard isn't a dead end on login — real stats
// (sales, order counts, low stock) are the next build.
const LINKS = [
  { to: "/admin/customers", label: "Customers", hint: "View, search, disable accounts" },
  { to: "/admin/orders", label: "Orders", hint: "View and update order status" },
  { to: "/admin/products", label: "Products", hint: "Add, edit, enable/disable" },
  { to: "/admin/categories", label: "Categories", hint: "Add, reorder, hide" },
  { to: "/admin/coupons", label: "Coupons", hint: "Create discount codes" },
  { to: "/admin/settings", label: "Settings", hint: "Manage admin access" },
];

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">Sales stats are coming in a later phase. For now, jump straight to a section:</p>
      <div className="dash-grid">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="dash-card">
            <strong>{l.label}</strong>
            <span className="muted">{l.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
