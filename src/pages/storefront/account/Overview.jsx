import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Heart, MapPin, UserRound, ShieldCheck, LifeBuoy, ChevronRight, LogOut, Truck } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { logoutUser } from "../../../services/authService";
import { getMyOrders } from "../../../services/customerOrderService";
import { getWishlistIds } from "../../../services/wishlistService";
import { formatCurrency } from "../../../utils/format";
import { BRAND } from "../../../config/brand";

export default function Overview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!user) return;
    getMyOrders(user.uid).then(setOrders).catch(() => setOrders([]));
    getWishlistIds(user.uid).then((ids) => setSaved(ids.length)).catch(() => setSaved(0));
  }, [user]);

  const fullName = user?.displayName || (user?.email || "").split("@")[0] || "Your account";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U";
  const latest = orders?.[0];
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  const items = [
    { to: "/account/orders", icon: Package, label: "My Orders", note: orders === null ? "" : plural(orders.length, "order") },
    { to: "/account/wishlist", icon: Heart, label: "Wishlist", note: saved === null ? "" : plural(saved, "saved item") },
    { to: "/account/addresses", icon: MapPin, label: "Addresses" },
    { to: "/account/profile", icon: UserRound, label: "Profile" },
    { to: "/account/security", icon: ShieldCheck, label: "Security" },
  ];

  return (
    <div className="acct-home">
      <div className="acct-id">
        <div className="acct-avatar" aria-hidden="true">{initials}</div>
        <div>
          <strong>{fullName}</strong>
          <span>{user?.email}</span>
        </div>
      </div>

      <Link to="/shop" className="acct-promo">
        <span className="acct-promo-text">
          <small>{BRAND.name}</small>
          <b>{BRAND.freeDelivery}</b>
          <em>Shop now</em>
        </span>
        <Truck size={44} strokeWidth={1.5} />
        <ChevronRight size={20} className="acct-promo-go" />
      </Link>

      {latest && (
        <div className="panel" style={{ marginBottom: 14 }}>
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

      <div className="acct-menu">
        {items.map(({ to, icon: Icon, label, note }) => (
          <Link key={to} to={to} className="acct-row">
            <Icon size={20} />
            <span>{label}{note && <small>{note}</small>}</span>
            <ChevronRight size={18} />
          </Link>
        ))}
        {BRAND.whatsapp && (
          <a className="acct-row" href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer">
            <LifeBuoy size={20} />
            <span>Help &amp; Support<small>Chat with us on WhatsApp</small></span>
            <ChevronRight size={18} />
          </a>
        )}
        <button type="button" className="acct-row" onClick={logoutUser}>
          <LogOut size={20} />
          <span>Log out</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="acct-secure">
        <ShieldCheck size={26} />
        <span><strong>Secure &amp; Reliable</strong>Your data is always protected.</span>
      </div>
    </div>
  );
}
