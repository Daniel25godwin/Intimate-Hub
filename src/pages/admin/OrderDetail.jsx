import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder, setOrderStatus } from "../../services/adminOrderService";
import { formatCurrency } from "../../utils/format";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(undefined);
  const [saving, setSaving] = useState(false);

  const load = () => getOrder(id).then(setOrder);
  useEffect(() => { load(); }, [id]);

  if (order === undefined) return <p>Loading…</p>;
  if (order === null) return <p>Order not found.</p>;

  async function changeStatus(e) {
    setSaving(true);
    await setOrderStatus(id, e.target.value);
    await load();
    setSaving(false);
  }

  return (
    <div>
      <Link to="/admin/orders">← Back to orders</Link>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1>{order.orderNumber}</h1>
        <select value={order.status} onChange={changeStatus} disabled={saving}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="detail-grid">
        <section>
          <h3>Items</h3>
          <table className="table">
            <thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th>Price</th><th>Line total</th></tr></thead>
            <tbody>
              {order.items?.map((i, idx) => (
                <tr key={idx}>
                  <td>{i.name}</td><td>{i.variant || "—"}</td><td>{i.qty}</td>
                  <td>{formatCurrency(i.price)}</td><td>{formatCurrency(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="summary-row"><span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span><span>−{formatCurrency(order.discount)}</span></div>}
          <div className="summary-row"><span>Delivery</span><span>{formatCurrency(order.deliveryFee)}</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{formatCurrency(order.total)}</span></div>

          <h3>Status history</h3>
          <ul>
            {order.statusHistory?.map((h, i) => (
              <li key={i}>{h.status} — {h.at?.seconds ? new Date(h.at.seconds * 1000).toLocaleString() : "—"}</li>
            ))}
          </ul>
        </section>

        <aside>
          <h3>Delivery</h3>
          <p>
            {order.deliveryAddress?.recipientName}<br />
            {order.deliveryAddress?.phone}<br />
            {order.deliveryAddress?.street}<br />
            {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
          </p>
          <p className="muted">Packaging: {order.packaging}</p>

          <h3>Payment</h3>
          <p>Status: <strong>{order.paymentStatus}</strong></p>
          <p className="muted">Method: {order.paymentMethod || "—"}</p>
          <p className="muted">{order.paymentRef ? `Ref: ${order.paymentRef}` : "No payment reference"}</p>
          {order.paidAt?.seconds && <p className="muted">Paid: {new Date(order.paidAt.seconds * 1000).toLocaleString()}</p>}

          <h3>Customer</h3>
          <p>{order.userId ? <Link to={`/admin/customers`}>{order.userId}</Link> : "Guest checkout"}</p>
        </aside>
      </div>
    </div>
  );
}
