import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../services/orderService";
import { formatCurrency } from "../../utils/format";

const DELIVERY_FEE = 1500; // display only — the real fee is computed in /api/orders/create

// Payment gateway (Paystack/Flutterwave) is Phase 2. For now the order is
// placed as unpaid and fulfilled against Pay on Delivery / Bank Transfer.
const PAYMENT_METHODS = [
  { id: "pay-on-delivery", label: "Pay on delivery" },
  { id: "bank-transfer", label: "Bank transfer (details sent after order)" },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const couponCode = location.state?.couponCode || null;

  const [form, setForm] = useState({
    name: "", email: user?.email || "", phone: "",
    street: "", city: "", state: "",
    payment: "pay-on-delivery",
  });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function placeOrder(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone || !form.street || !form.city || !form.state) {
      setError("Please fill in every field");
      return;
    }

    setPlacing(true);
    try {
      const result = await createOrder({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty, variant: i.variant })),
        deliveryAddress: { street: form.street, city: form.city, state: form.state, recipientName: form.name, phone: form.phone },
        couponCode,
        contactEmail: form.email,
        paymentMethod: form.payment,
      });
      clearCart();
      navigate(`/order-confirmation/${result.orderId}`, { state: result });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return <div className="section"><p>Your cart is empty. <a href="/shop">Go shopping</a>.</p></div>;
  }

  return (
    <div className="section cart-layout">
      <form onSubmit={placeOrder} className="form">
        <h1>Checkout</h1>

        <h3>Contact</h3>
        <input placeholder="Full name" value={form.name} onChange={set("name")} required />
        <div className="row">
          <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={set("phone")} required />
        </div>

        <h3>Delivery address</h3>
        <input placeholder="Street address" value={form.street} onChange={set("street")} required />
        <div className="row">
          <input placeholder="City" value={form.city} onChange={set("city")} required />
          <input placeholder="State" value={form.state} onChange={set("state")} required />
        </div>
        <p className="muted" style={{ fontSize: 13 }}>Shipped in plain, unbranded packaging.</p>

        <h3>Payment method</h3>
        {PAYMENT_METHODS.map((m) => (
          <label key={m.id} className="auth-check" style={{ marginBottom: 6 }}>
            <input type="radio" name="payment" checked={form.payment === m.id} onChange={() => setForm({ ...form, payment: m.id })} />
            <span>{m.label}</span>
          </label>
        ))}

        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={placing}>{placing ? "Placing order…" : "Place order"}</button>
      </form>

      <aside className="cart-summary">
        <h3>Order summary</h3>
        {items.map((i) => (
          <div key={`${i.productId}::${i.variant || ""}`} className="summary-row">
            <span>{i.name} {i.variant ? `(${i.variant})` : ""} × {i.qty}</span>
            <span>{formatCurrency(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        {couponCode && <div className="summary-row"><span>Code {couponCode}</span><span>applied at checkout</span></div>}
        <div className="summary-row"><span>Delivery</span><span>{formatCurrency(DELIVERY_FEE)}</span></div>
        <p className="muted" style={{ fontSize: 12 }}>Final total is confirmed on the next screen.</p>
      </aside>
    </div>
  );
}
