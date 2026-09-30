import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { payNow } from "../../services/paymentService";
import CheckoutSteps from "../../components/storefront/CheckoutSteps";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state; // passed from checkout / payment callback — no re-fetch needed
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const online = order?.paymentMethod === "online";
  const paid = order?.paymentStatus === "paid";

  async function pay() {
    setPaying(true); setError("");
    try { await payNow(orderId); }
    catch (err) { setError(err.message); setPaying(false); }
  }

  let message = "We'll be in touch to confirm delivery.";
  if (paid) message = "Payment received. We'll be in touch to confirm delivery.";
  else if (online) message = "Your order is saved, but payment isn't complete yet. Finish paying to confirm it.";

  return (
    <div className="confirm">
      <div style={{ display: "flex", justifyContent: "center" }}><CheckoutSteps current={4} /></div>
      <div className="auth-success" style={{ margin: "0 auto 16px" }}><Check size={26} strokeWidth={2.5} /></div>
      <h1>{paid ? "Payment received" : "Order placed"}</h1>
      <p className="muted">
        Order <strong>{order?.orderNumber || orderId}</strong> has been received. {message}
        {" "}Packaging is always plain and unbranded.
      </p>
      {order?.total != null && (
        <div className="summary-row summary-total" style={{ justifyContent: "center", gap: 10, border: 0 }}>
          <span>Total</span><span>{formatCurrency(order.total)}</span>
        </div>
      )}
      {online && !paid && <button className="btn" onClick={pay} disabled={paying} style={{ marginBottom: 12 }}>{paying ? "Redirecting…" : "Pay now"}</button>}
      {error && <p className="error" role="alert">{error}</p>}
      <div><Link to="/account/orders" className={online && !paid ? "" : "btn"}>View my orders</Link></div>
      <p style={{ marginTop: 16 }}><Link to="/shop">Continue shopping</Link></p>
    </div>
  );
}
