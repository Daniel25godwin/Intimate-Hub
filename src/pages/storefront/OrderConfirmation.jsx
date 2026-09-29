import { Link, useLocation, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import CheckoutSteps from "../../components/storefront/CheckoutSteps";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state; // passed straight from checkout — no re-fetch needed

  return (
    <div className="confirm">
      <div style={{ display: "flex", justifyContent: "center" }}><CheckoutSteps current={4} /></div>
      <div className="auth-success" style={{ margin: "0 auto 16px" }}><Check size={26} strokeWidth={2.5} /></div>
      <h1>Order placed</h1>
      <p className="muted">
        Order <strong>{order?.orderNumber || orderId}</strong> has been received.
        {" "}We'll be in touch to confirm delivery. Packaging is always plain and unbranded.
      </p>
      {order?.total != null && (
        <div className="summary-row summary-total" style={{ justifyContent: "center", gap: 10, border: 0 }}>
          <span>Total</span><span>{formatCurrency(order.total)}</span>
        </div>
      )}
      <Link to="/account/orders" className="btn">View my orders</Link>
      <p style={{ marginTop: 16 }}><Link to="/shop">Continue shopping</Link></p>
    </div>
  );
}
