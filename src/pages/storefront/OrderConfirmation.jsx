import { Link, useLocation, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { formatCurrency } from "../../utils/format";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state; // passed straight from checkout — no re-fetch needed

  return (
    <div className="section" style={{ maxWidth: 480, textAlign: "center", padding: "60px 24px" }}>
      <div className="auth-success" style={{ margin: "0 auto 16px" }}><Check size={26} strokeWidth={2.5} /></div>
      <h1>Order placed</h1>
      <p className="muted">
        Order <strong>{order?.orderNumber || orderId}</strong> has been received.
        {" "}We'll be in touch to confirm delivery. Packaging is always plain and unbranded.
      </p>
      {order?.total != null && (
        <div className="summary-row" style={{ justifyContent: "center", gap: 8 }}>
          <span>Total:</span><strong>{formatCurrency(order.total)}</strong>
        </div>
      )}
      <Link to="/account/orders" className="btn" style={{ marginTop: 20 }}>View my orders</Link>
      <p style={{ marginTop: 14 }}><Link to="/shop">Continue shopping</Link></p>
    </div>
  );
}
