import { Link } from "react-router-dom";
import { Package, ShieldCheck, Lock } from "lucide-react";
import "../../styles/auth.css";

const POINTS = [
  { icon: Package, title: "Discreet packaging", text: "Plain outer box, no branding, no product names." },
  { icon: Lock, title: "Private billing", text: "A neutral name appears on your statement." },
  { icon: ShieldCheck, title: "Secure by design", text: "Your details are never shared or sold." },
];

// Split layout: brand panel (desktop) + form column. Shared by Login,
// Register and Forgot Password so they all feel like one product.
export default function AuthShell({ children }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <Link to="/" className="auth-wordmark">
          <span className="auth-mark">IH</span>
          <span>Intimate Hub</span>
        </Link>
        <div className="auth-brand-copy">
          <h2>Wellness, on your terms.</h2>
          <p>Thoughtfully chosen products, delivered with complete discretion.</p>
        </div>
        <ul className="auth-points">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon size={18} strokeWidth={1.6} />
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
