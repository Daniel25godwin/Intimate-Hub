import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, CreditCard, Landmark, Smartphone, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../services/orderService";
import { formatCurrency } from "../../utils/format";
import CheckoutSteps from "../../components/storefront/CheckoutSteps";
import { payNow } from "../../services/paymentService";

const DELIVERY_FEE = 0; // free delivery — must match the fee set in /api/orders/create

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

// Full-screen screen shown between "Place order" and Paystack, so the
// customer never sees an empty cart or a frozen page while we redirect.
function PayingScreen({ step }) {
  return (
    <div className="pay-overlay" role="status" aria-live="polite">
      <div>
        <div className="spinner" />
        <h2>{step === "redirecting" ? "Taking you to secure payment…" : "Placing your order…"}</h2>
        <ul className="pay-progress">
          <li className={step === "redirecting" ? "done" : "now"}>
            <span>{step === "redirecting" ? <Check size={14} /> : ""}</span> Order saved
          </li>
          <li className={step === "redirecting" ? "now" : ""}>
            <span /> Connecting to Paystack
          </li>
        </ul>
        <p className="muted"><Lock size={14} style={{ verticalAlign: "-2px" }} /> Please don't close or refresh this page.</p>
      </div>
    </div>
  );
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
  });
  const [error, setError] = useState("");
  const [step, setStep] = useState(null); // null | "creating" | "redirecting"

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function placeOrder(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone || !form.street || !form.city || !form.state) {
      setError("Please fill in every field.");
      return;
    }

    setStep("creating");
    let redirecting = false;
    try {
      const result = await createOrder({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty, variant: i.variant })),
        deliveryAddress: { street: form.street, city: form.city, state: form.state, recipientName: form.name, phone: form.phone },
        couponCode,
        contactEmail: form.email,
        paymentMethod: "online",
      });
      clearCart();
      setStep("redirecting");
      try {
        redirecting = true;
        await payNow(result.orderId); // leaves the site for Paystack
        return;
      } catch {
        redirecting = false; // order is saved; the confirmation page offers "Pay now"
      }
      navigate(`/order-confirmation/${result.orderId}`, { state: result });
    } catch (err) {
      setError(err.message);
    } finally {
      if (!redirecting) setStep(null);
    }
  }

  if (step) return <PayingScreen step={step} />;

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
            <h3>Payment</h3>
            <div className="pay-option on">
              <Lock size={18} style={{ marginTop: 2, color: "var(--accent)", flexShrink: 0 }} />
              <span>
                <strong>Pay securely online</strong>
                <small>After you continue, you'll pay on Paystack's secure page and come straight back here. Your order is confirmed as soon as payment goes through.</small>
              </span>
            </div>
            <ul className="pay-methods" aria-label="Accepted payment methods">
              <li><CreditCard size={16} /> Debit card</li>
              <li><Landmark size={16} /> Bank transfer</li>
              <li><Smartphone size={16} /> USSD</li>
            </ul>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>We never see or store your card details.</p>
          </div>

          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn"><Lock size={16} /> Continue to secure payment</button>
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
          {couponCode && <div className="summary-row"><span>Code {couponCode}</span><span>applied at payment</span></div>}
          <div className="summary-row"><span>Delivery</span><span>{DELIVERY_FEE === 0 ? "Free" : formatCurrency(DELIVERY_FEE)}</span></div>
          <div className="summary-row summary-total"><span>{couponCode ? "Total before code" : "Total"}</span><span>{formatCurrency(subtotal + DELIVERY_FEE)}</span></div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>You'll see the final amount on the payment page.</p>
        </aside>
      </div>
    </div>
  );
}
