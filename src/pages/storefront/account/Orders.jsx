import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getMyOrders } from "../../../services/customerOrderService";
import { payNow } from "../../../services/paymentService";
import { formatCurrency } from "../../../utils/format";

const STATUS_LABEL = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) getMyOrders(user.uid).then(setOrders).catch(() => setOrders([]));
  }, [user]);

  async function pay(id) {
    setPayingId(id); setError("");
    try { await payNow(id); } catch (err) { setError(err.message); setPayingId(null); }
  }

  if (authLoading || orders === null) return <div className="section"><div className="skeleton" style={{ minHeight: 200 }} /></div>;

  if (orders.length === 0) {
    return (
      <div className="section empty">
        <div className="empty-icon"><Package size={26} /></div>
        <h2>No orders yet</h2>
        <p className="muted">When you place an order, you can follow it here.</p>
        <Link to="/shop" className="btn">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>My orders</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => {
              const needsPayment = o.paymentMethod === "online" && o.paymentStatus !== "paid" && o.status !== "cancelled";
              return (
                <tr key={o.id}>
                  <td><strong>{o.orderNumber}</strong></td>
                  <td>{o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : "—"}</td>
                  <td>{o.items?.length || 0}</td>
                  <td>{formatCurrency(o.total)}</td>
                  <td>
                    {o.paymentStatus === "paid" ? <span className="pill pill-delivered">Paid</span>
                      : needsPayment ? <button className="btn" style={{ padding: "5px 14px" }} onClick={() => pay(o.id)} disabled={payingId === o.id}>{payingId === o.id ? "…" : "Pay now"}</button>
                      : <span className="pill pill-pending">Awaiting payment</span>}
                  </td>
                  <td><span className={`pill pill-${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
