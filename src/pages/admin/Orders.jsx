import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listOrders } from "../../services/adminOrderService";
import { formatCurrency } from "../../utils/format";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [params, setParams] = useSearchParams();
  const customerFilter = params.get("customer");

  useEffect(() => { listOrders().then(setOrders).finally(() => setLoading(false)); }, []);

  const shown = useMemo(() => orders.filter((o) => {
    if (customerFilter && o.userId !== customerFilter) return false;
    if (status && o.status !== status) return false;
    if (q && !(`${o.orderNumber} ${o.deliveryAddress?.recipientName || ""}`).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [orders, q, status, customerFilter]);

  return (
    <div>
      <h1>Orders</h1>
      {customerFilter && (
        <p className="muted">
          Filtered to one customer — <a href="#" onClick={(e) => { e.preventDefault(); setParams({}); }}>clear</a>
        </p>
      )}
      <div className="row">
        <input placeholder="Search order # or name" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <p>Loading…</p> : shown.length === 0 ? <p className="muted">No orders found.</p> : (
        <table className="table">
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id}>
                <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                <td>{o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : "—"}</td>
                <td>{o.deliveryAddress?.recipientName || "Guest"}</td>
                <td>{o.items?.length || 0}</td>
                <td>{formatCurrency(o.total)}</td>
                <td><span className={`pill ${o.paymentStatus === "paid" ? "pill-green" : "pill-amber"}`}>{o.paymentStatus}</span></td>
                <td><span className={`pill pill-${o.status}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
