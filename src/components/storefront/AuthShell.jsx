import { Link } from "react-router-dom";
import { Truck, ShieldCheck, Lock } from "lucide-react";
import { BRAND } from "../../config/brand";
import "../../styles/auth.css";

const POINTS = [
  { icon: Truck, title: BRAND.freeDelivery, text: "Straight to your door." },
  { icon: Lock, title: "Secure payment", text: "Pay by card, bank transfer or USSD." },
  { icon: ShieldCheck, title: "Your details stay private", text: "We never share or sell your information." },
];

const initials = BRAND.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// Split layout: brand panel (desktop) + form column. Shared by Login,
// Register, Verify email and Forgot Password so they all feel like one product.
export default function AuthShell({ children }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <Link to="/" className="auth-wordmark">
          <span className="auth-mark">{initials}</span>
          <span>{BRAND.name}</span>
        </Link>
        <div className="auth-brand-copy">
          <h2>Welcome to {BRAND.name}.</h2>
          <p>Quality products for every need, delivered to your door.</p>
        </div>
        <ul className="auth-points">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon size={18} strokeWidth={1.8} />
              <div><strong>{title}</strong><span>{text}</span></div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
