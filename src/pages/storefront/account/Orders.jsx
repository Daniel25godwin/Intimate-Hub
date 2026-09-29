import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getMyOrders } from "../../../services/customerOrderService";
import { formatCurrency } from "../../../utils/format";

const STATUS_LABEL = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (user) getMyOrders(user.uid).then(setOrders).catch(() => setOrders([]));
  }, [user]);

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
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.orderNumber}</strong></td>
                <td>{o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : "—"}</td>
                <td>{o.items?.length || 0}</td>
                <td>{formatCurrency(o.total)}</td>
                <td><span className={`pill pill-${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
