import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, Copy, History, Clock, Mail, PackageCheck, ShoppingBag, ArrowRight } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/format";
import { markPaid, getOrderByKey } from "../../services/paymentService";
import CheckoutSteps from "../../components/storefront/CheckoutSteps";

function CopyButton({ value }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn-link" onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      <Copy size={14} /> {done ? "Copied" : "Copy"}
    </button>
  );
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const k = params.get("k"); // guest access key from the order link
  const [order, setOrder] = useState(undefined); // undefined = loading, null = not found
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justSent, setJustSent] = useState(false);

  // With a key (guests, email link) read through the API; otherwise the signed-in owner reads Firestore.
  const load = () =>
    (k
      ? getOrderByKey(orderId, k)
      : getDoc(doc(db, "orders", orderId)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null)))
      .then(setOrder)
      .catch(() => setOrder(null));

  useEffect(() => {
    if (authLoading) return;
    if (k || user) load(); else setOrder(null);
  }, [orderId, k, user, authLoading]);

  async function iHavePaid() {
    setBusy(true); setError("");
    try {
      await markPaid(orderId, k);
      setJustSent(true);
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  if (order === undefined) return <div className="section"><div className="skeleton" style={{ minHeight: 300 }} /></div>;
  if (order === null) {
    return (
      <div className="section empty">
        <h2>We couldn't find that order</h2>
        <p className="muted">Open the link from your order email, or sign in with the account you ordered with.</p>
        <div className="confirm-actions"><Link to="/login" className="btn">Sign in</Link><Link to="/shop" className="btn btn-outline">Continue shopping</Link></div>
      </div>
    );
  }

  const paid = order.paymentStatus === "paid";
  const checking = order.paymentStatus === "awaiting_confirmation";
  const cancelled = order.status === "cancelled";
  const bank = order.bank || {};

  let heading = "We have your order";
  let lead = "Your order is not confirmed until we see your transfer. Send the exact amount below and use the order number as the narration.";
  if (paid) { heading = "Order confirmed"; lead = "We've received your payment and your order is confirmed. We'll be in touch about delivery."; }
  else if (checking) { heading = "Order received"; lead = ""; }
  else if (cancelled) { heading = "Order cancelled"; lead = "This order was cancelled."; }

  const history = [...(order.statusHistory || [])].filter((h) => h.note).reverse();

  return (
    <div className="confirm" style={{ maxWidth: 640, margin: "0 auto", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "center" }}><CheckoutSteps current={paid || checking ? 4 : 3} /></div>
      {checking && (
        <div className="panel" role="status" style={{ textAlign: "center", borderColor: "var(--accent)", background: "var(--soft)" }}>
          <div className="auth-success" style={{ margin: "0 auto 12px" }}><Check size={26} strokeWidth={2.5} /></div>
          <h1 style={{ margin: "0 0 4px" }}>{justSent ? "Thanks — order received!" : "Order received"}</h1>
          <p className="muted" style={{ margin: "0 0 12px" }}>Order <strong>{order.orderNumber}</strong> · {formatCurrency(order.total)}</p>
          <p style={{ margin: "0 0 16px" }}>Thank you! We've been told you've paid, and we're now checking our account for your transfer.</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 auto 16px", maxWidth: 380, textAlign: "left" }}>
            <li style={{ display: "flex", gap: 8, marginBottom: 8 }}><Check size={18} /> Order placed</li>
            <li style={{ display: "flex", gap: 8, marginBottom: 8 }}><Check size={18} /> Payment notice received</li>
            <li style={{ display: "flex", gap: 8, marginBottom: 8 }}><Clock size={18} /> We confirm your transfer</li>
            <li style={{ display: "flex", gap: 8 }}><PackageCheck size={18} /> We prepare your delivery</li>
          </ul>
          <p className="muted" style={{ fontSize: 14 }}><Mail size={14} style={{ verticalAlign: "-2px" }} /> We'll email you at <strong>{order.contactEmail}</strong> as soon as your order is confirmed. You can also check this page {user ? <>or <Link to="/account/orders">My orders</Link>.</> : "or use the link in your email."}</p>
        </div>
      )}

      {!checking && (<><h1>{heading}</h1>
      <p className="muted">Order <strong>{order.orderNumber}</strong></p>
      <p>{lead}</p></>)}

      {!paid && !cancelled && !checking && (
        <>
          <div className="panel">
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="summary-row"><span>Discount</span><span>−{formatCurrency(order.discount)}</span></div>}
            {order.processingFee > 0 && <div className="summary-row"><span>Processing fee</span><span>{formatCurrency(order.processingFee)}</span></div>}
            <div className="summary-row"><span>Delivery{order.deliveryMethodLabel ? ` (${order.deliveryMethodLabel})` : ""}</span><span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Free"}</span></div>
            <div className="summary-row"><span>Amount to transfer</span><strong>{formatCurrency(order.total)}</strong></div>
            <div className="summary-row"><span>Use as narration</span><span><strong>{order.orderNumber}</strong> <CopyButton value={order.orderNumber} /></span></div>
          </div>

          <div className="panel">
            <h3>{bank.bankName || "Bank"}</h3>
            <div className="summary-row">
              <strong style={{ fontSize: 22, letterSpacing: 1 }}>{bank.accountNumber || "—"}</strong>
              {bank.accountNumber && <CopyButton value={bank.accountNumber} />}
            </div>
            <p className="muted">{bank.accountName}</p>
            <p className="muted" style={{ fontSize: 13 }}>Use your order number as the transfer narration so we can match your payment fast.</p>
          </div>

          <div className="panel">
            <h3>Done transferring?</h3>
            <p className="muted" style={{ fontSize: 14 }}>Once you've sent <strong>{formatCurrency(order.total)}</strong> with <strong>{order.orderNumber}</strong> as the narration, tap the button below so we know to look for it.</p>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn btn-gold" onClick={iHavePaid} disabled={busy} style={{ width: "100%" }}>
              <Check size={16} /> {busy ? "Sending…" : "I have paid"}
            </button>
          </div>
        </>
      )}

      <div className="panel">
        <h3><History size={16} style={{ verticalAlign: "-3px" }} /> Order updates</h3>
        {history.length === 0 ? <p className="muted">No updates yet.</p> : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 12 }}>
                {h.note}
                <div className="muted" style={{ fontSize: 13 }}>{h.at?.seconds ? new Date(h.at.seconds * 1000).toLocaleString() : ""}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="confirm-actions">
        {user && <Link to="/account/orders" className="btn btn-gold"><ShoppingBag size={18} /> View my orders</Link>}
        <Link to="/shop" className={user ? "btn btn-outline" : "btn btn-gold"}>Continue shopping <ArrowRight size={18} /></Link>
      </div>
      {!user && <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>Bookmark this page or use the link in your email to come back to this order any time.</p>}
    </div>
  );
}
