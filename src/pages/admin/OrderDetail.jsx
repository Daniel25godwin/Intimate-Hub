import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder, updateOrder } from "../../services/adminOrderService";
import { formatCurrency } from "../../utils/format";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = () => getOrder(id).then(setOrder);
  useEffect(() => { load(); }, [id]);

  if (order === undefined) return <p>Loading…</p>;
  if (order === null) return <p>Order not found.</p>;

  async function apply(changes) {
    setSaving(true); setNotice("");
    try {
      const r = await updateOrder(id, changes);
      await load();
      if (r.rejected) setNotice(r.emailed ? "Marked as not found. The customer has been emailed to check and upload again." : "Marked as not found, but the email could not be sent.");
      else if (r.emailed) setNotice("Order updated. The customer has been emailed that their order is confirmed.");
      else if (r.emailFailed) setNotice("Order updated, but the confirmation email could not be sent. Check your mail settings.");
      else setNotice("Order updated.");
    } catch (err) { setNotice(err.message); }
    setSaving(false);
  }
  function reject() {
    const reason = prompt("Tell the customer why (optional), e.g. “Amount received was ₦5,000, not ₦6,550”:");
    if (reason === null) return;
    apply({ rejectPayment: true, reason });
  }
  const changeStatus = (e) => apply({ status: e.target.value });
  const awaiting = order.paymentStatus === "awaiting_confirmation";

  return (
    <div>
      <Link to="/admin/orders">← Back to orders</Link>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1>{order.orderNumber}</h1>
        <select value={order.status} onChange={changeStatus} disabled={saving}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {awaiting && (
        <p className="notice" role="status" style={{ background: "#fff7e0", padding: 12, borderRadius: 8 }}>
          The customer says they've paid {formatCurrency(order.total)}. Check your bank for a transfer with narration <strong>{order.orderNumber}</strong>, then confirm below.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}

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
          {order.processingFee > 0 && <div className="summary-row"><span>Processing fee</span><span>{formatCurrency(order.processingFee)}</span></div>}
          <div className="summary-row"><span>Delivery{order.deliveryMethodLabel ? ` (${order.deliveryMethodLabel})` : ""}</span><span>{formatCurrency(order.deliveryFee)}</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{formatCurrency(order.total)}</span></div>

          <h3>Status history</h3>
          <ul>
            {order.statusHistory?.map((h, i) => (
              <li key={i}>{h.status}{h.note ? ` — ${h.note}` : ""} — {h.at?.seconds ? new Date(h.at.seconds * 1000).toLocaleString() : "—"}</li>
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
          <p className="muted">Narration: {order.orderNumber}</p>
          {order.paidAt?.seconds && <p className="muted">Paid: {new Date(order.paidAt.seconds * 1000).toLocaleString()}</p>}
          {order.paymentProofUrl && (
            <p>
              <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">View payment proof</a>
            </p>
          )}
          {order.paymentStatus !== "paid" && order.status !== "cancelled" && (
            <div className="row">
              <button onClick={() => apply({ confirmPayment: true })} disabled={saving}>
                {saving ? "Saving…" : "Confirm payment & order"}
              </button>
              {awaiting && (
                <button onClick={reject} disabled={saving}>Payment not found</button>
              )}
            </div>
          )}

          <h3>Customer</h3>
          <p>{order.userId ? <Link to={`/admin/customers`}>{order.userId}</Link> : "Guest checkout"}</p>
        </aside>
      </div>
    </div>
  );
}
