import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Copy, Upload, History } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/format";
import { submitPaymentProof } from "../../services/paymentService";
import CheckoutSteps from "../../components/storefront/CheckoutSteps";

const MAX_BYTES = 10 * 1024 * 1024;

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
  const [order, setOrder] = useState(undefined); // undefined = loading, null = not found
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    getDoc(doc(db, "orders", orderId))
      .then((s) => setOrder(s.exists() ? { id: s.id, ...s.data() } : null))
      .catch(() => setOrder(null));

  useEffect(() => { if (!authLoading && user) load(); else if (!authLoading) setOrder(null); }, [orderId, user, authLoading]);

  function pick(e) {
    const f = e.target.files?.[0];
    setError("");
    if (!f) return setFile(null);
    if (!/^image\//.test(f.type) && f.type !== "application/pdf") return setError("Please choose a photo, screenshot or PDF.");
    if (f.size > MAX_BYTES) return setError("That file is over 10MB.");
    setFile(f);
  }

  async function iHavePaid() {
    if (!file) return;
    setBusy(true); setError("");
    try {
      await submitPaymentProof(orderId, file);
      setFile(null);
      await load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  if (order === undefined) return <div className="section"><div className="skeleton" style={{ minHeight: 300 }} /></div>;
  if (order === null) {
    return (
      <div className="section empty">
        <h2>We couldn't find that order</h2>
        <p className="muted">Sign in with the account you ordered with.</p>
        <Link to="/account/orders" className="btn">My orders</Link>
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
  else if (checking) { heading = "Thanks — we're checking your payment"; lead = "We've been told you've paid. We'll confirm your order as soon as we see the transfer, and email you when it's done."; }
  else if (cancelled) { heading = "Order cancelled"; lead = "This order was cancelled."; }

  const history = [...(order.statusHistory || [])].filter((h) => h.note).reverse();

  return (
    <div className="confirm" style={{ maxWidth: 640, margin: "0 auto", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "center" }}><CheckoutSteps current={paid ? 4 : 3} /></div>
      <h1>{heading}</h1>
      <p className="muted">Order <strong>{order.orderNumber}</strong></p>
      <p>{lead}</p>

      {!paid && !cancelled && (
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
            <h3>{checking ? "Payment proof sent" : "Confirm your payment"}</h3>
            {checking && order.paymentProofUrl && <p><a href={order.paymentProofUrl} target="_blank" rel="noreferrer">View the receipt you sent</a></p>}
            <label className="field">
              <span><Upload size={16} style={{ verticalAlign: "-3px" }} /> {checking ? "Upload a different receipt" : "Upload proof of payment"}</span>
              <input type="file" accept="image/*,application/pdf" onChange={pick} />
              <small className="muted">Photo, screenshot or PDF · max 10MB</small>
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn" onClick={iHavePaid} disabled={!file || busy}>
              <Check size={16} /> {busy ? "Sending…" : checking ? "Send new receipt" : "I have paid"}
            </button>
            {!file && !checking && <p className="muted" style={{ fontSize: 13 }}>Upload your transfer receipt first. Then “I have paid” unlocks.</p>}
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

      <p><Link to="/account/orders">View my orders</Link> · <Link to="/shop">Continue shopping</Link></p>
    </div>
  );
}
