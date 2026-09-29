import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    if (user) getMyOrders(user.uid).then(setOrders);
  }, [user]);

  if (authLoading || orders === null) return <div className="section"><p>Loading…</p></div>;
  if (orders.length === 0) return <div className="section"><p>No orders yet. <Link to="/shop">Start shopping</Link>.</p></div>;

  return (
    <div className="section">
      <h2>My orders</h2>
      <table className="table">
        <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.orderNumber}</td>
              <td>{o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : "—"}</td>
              <td>{o.items?.length || 0}</td>
              <td>{formatCurrency(o.total)}</td>
              <td>{STATUS_LABEL[o.status] || o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
