import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../services/orderService";
import { formatCurrency } from "../../utils/format";
import CheckoutSteps from "../../components/storefront/CheckoutSteps";

const DELIVERY_FEE = 1500; // display only — the real fee is computed in /api/orders/create

// Payment gateway (Paystack/Flutterwave) is Phase 2. For now the order is
// placed as unpaid and fulfilled against Pay on Delivery / Bank Transfer.
const PAYMENT_METHODS = [
  { id: "pay-on-delivery", label: "Pay on delivery", hint: "Pay the rider when your order arrives." },
  { id: "bank-transfer", label: "Bank transfer", hint: "We send the account details after you place the order." },
];

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

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
      setError("Please fill in every field.");
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
    return (
      <div className="section empty">
        <h1>Your cart is empty</h1>
        <Link to="/shop" className="btn">Go shopping</Link>
      </div>
    );
  }

  return (
    <div className="section">
      <CheckoutSteps current={2} />
      <div className="cart-layout">
        <form onSubmit={placeOrder} className="form">
          <h1>Checkout</h1>

          <div className="panel">
            <h3>Contact</h3>
            <Field label="Full name"><input value={form.name} onChange={set("name")} autoComplete="name" required /></Field>
            <div className="row" style={{ marginBottom: 0 }}>
              <Field label="Email"><input type="email" value={form.email} onChange={set("email")} autoComplete="email" required /></Field>
              <Field label="Phone"><input type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" required /></Field>
            </div>
          </div>

          <div className="panel">
            <h3>Delivery address</h3>
            <Field label="Street address"><input value={form.street} onChange={set("street")} autoComplete="street-address" required /></Field>
            <div className="row" style={{ marginBottom: 0 }}>
              <Field label="City"><input value={form.city} onChange={set("city")} autoComplete="address-level2" required /></Field>
              <Field label="State"><input value={form.state} onChange={set("state")} autoComplete="address-level1" required /></Field>
            </div>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>Shipped in plain, unbranded packaging.</p>
          </div>

          <div className="panel">
            <h3>Payment method</h3>
            {PAYMENT_METHODS.map((m) => (
              <label key={m.id} className={`pay-option ${form.payment === m.id ? "on" : ""}`}>
                <input type="radio" name="payment" checked={form.payment === m.id} onChange={() => setForm({ ...form, payment: m.id })} />
                <span><strong>{m.label}</strong><small>{m.hint}</small></span>
              </label>
            ))}
          </div>

          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn" disabled={placing}>{placing ? "Placing order…" : "Place order"}</button>
        </form>

        <aside className="cart-summary">
          <h3>Order summary</h3>
          {items.map((i) => (
            <div key={`${i.productId}::${i.variant || ""}`} className="summary-row">
              <span>{i.name}{i.variant ? ` (${i.variant})` : ""} × {i.qty}</span>
              <span>{formatCurrency(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {couponCode && <div className="summary-row"><span>Code {couponCode}</span><span>applied at checkout</span></div>}
          <div className="summary-row"><span>Delivery</span><span>{formatCurrency(DELIVERY_FEE)}</span></div>
          <div className="summary-row summary-total"><span>{couponCode ? "Total before code" : "Total"}</span><span>{formatCurrency(subtotal + DELIVERY_FEE)}</span></div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>You'll see the final total once the order is placed.</p>
        </aside>
      </div>
    </div>
  );
}
