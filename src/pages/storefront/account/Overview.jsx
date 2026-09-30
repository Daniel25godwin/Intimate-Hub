import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getMyOrders } from "../../../services/customerOrderService";
import { getWishlistIds } from "../../../services/wishlistService";
import { formatCurrency } from "../../../utils/format";

export default function Overview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!user) return;
    getMyOrders(user.uid).then(setOrders).catch(() => setOrders([]));
    getWishlistIds(user.uid).then((ids) => setSaved(ids.length)).catch(() => setSaved(0));
  }, [user]);

  const name = (user?.displayName || user?.email || "").split(/[ @]/)[0];
  const latest = orders?.[0];
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  return (
    <div>
      <h2>Hello{name ? `, ${name}` : ""}</h2>
      <p className="muted">Follow your orders, keep your details up to date and save things for later.</p>

      {latest && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <span className="muted" style={{ fontSize: 13 }}>Latest order</span>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <strong>{latest.orderNumber}</strong>
            <span>{formatCurrency(latest.total)}</span>
          </div>
          <div>
            <span className={`pill pill-${latest.status}`} style={{ textTransform: "capitalize" }}>{latest.status}</span>{" "}
            <span className={`pill ${latest.paymentStatus === "paid" ? "pill-delivered" : "pill-pending"}`}>{latest.paymentStatus === "paid" ? "Paid" : "Awaiting payment"}</span>
          </div>
        </div>
      )}

      <div className="acct-grid">
        <Link to="/account/orders" className="acct-card"><strong>Orders</strong><span className="muted">{orders === null ? "Loading…" : plural(orders.length, "order")}</span></Link>
        <Link to="/account/wishlist" className="acct-card"><strong>Wishlist</strong><span className="muted">{saved === null ? "Loading…" : plural(saved, "saved item")}</span></Link>
        <Link to="/account/addresses" className="acct-card"><strong>Addresses</strong><span className="muted">Where we deliver</span></Link>
        <Link to="/account/profile" className="acct-card"><strong>Profile</strong><span className="muted">Name and phone</span></Link>
        <Link to="/account/security" className="acct-card"><strong>Security</strong><span className="muted">Password and sign-in</span></Link>
      </div>
    </div>
  );
}
