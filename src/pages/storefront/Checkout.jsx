import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Landmark, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../services/orderService";
import { formatCurrency } from "../../utils/format";
import CheckoutSteps from "../../components/storefront/CheckoutSteps";
import { getCheckoutDefaults } from "../../services/accountService";
import { DELIVERY_METHODS, PROCESSING_FEE } from "../../config/delivery";
import LegalModal from "../../components/storefront/LegalModal";


function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

// Shown while the order is being saved, so the customer never sees a frozen page.
function PlacingScreen() {
  return (
    <div className="pay-overlay" role="status" aria-live="polite">
      <div>
        <div className="spinner" />
        <h2>Placing your order…</h2>
        <p className="muted">Please don't close or refresh this page.</p>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  let storedCoupon = null;
  try { storedCoupon = sessionStorage.getItem("ih_coupon"); } catch { /* ignore */ }
  const couponCode = location.state?.couponCode || storedCoupon || null;

  const [form, setForm] = useState({
    name: "", email: user?.email || "", phone: "",
    street: "", city: "", state: "",
  });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("waybill");
  const [accepted, setAccepted] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null);
  const method = DELIVERY_METHODS.find((m) => m.id === deliveryMethod);
  const deliveryFee = method.fee;

  // signed-in customers: fill in their saved name, phone and default address
  useEffect(() => {
    if (!user) return;
    getCheckoutDefaults(user.uid)
      .then((d) => setForm((f) => ({
        ...f,
        email: f.email || user.email || "",
        name: f.name || d.name || "", phone: f.phone || d.phone || "",
        street: f.street || d.street || "", city: f.city || d.city || "", state: f.state || d.state || "",
      })))
      .catch(() => {});
  }, [user]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function placeOrder(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone || !form.street || !form.city || !form.state) {
      setError("Please fill in every field.");
      return;
    }

    if (!accepted) { setError("Please accept the terms & delivery policy."); return; }
    setPlacing(true);
    try {
      const result = await createOrder({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty, variant: i.variant })),
        deliveryAddress: { street: form.street, city: form.city, state: form.state, recipientName: form.name, phone: form.phone },
        couponCode,
        contactEmail: form.email,
        paymentMethod: "transfer",
        deliveryMethod,
        acceptedTerms: true,
      });
      clearCart();
      try { sessionStorage.removeItem("ih_coupon"); } catch { /* ignore */ }
      navigate(`/order-confirmation/${result.orderId}?k=${result.accessToken}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  }

  // Guests can check out too — no account needed.
  if (authLoading) return <div className="section"><div className="skeleton" style={{ minHeight: 300 }} /></div>;

  if (placing) return <PlacingScreen />;

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
          {!user && (
            <p className="muted" style={{ marginTop: -8 }}>
              Checking out as a guest. <Link to="/login" state={{ from: location }}>Sign in</Link> to save your details and track orders in your account.
            </p>
          )}

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
          </div>

          <div className="panel">
            <h3>Delivery method</h3>
            {DELIVERY_METHODS.map((m) => (
              <label key={m.id} className={`pay-option${deliveryMethod === m.id ? " on" : ""}`} style={{ marginBottom: 8 }}>
                <input type="radio" name="deliveryMethod" value={m.id} checked={deliveryMethod === m.id} onChange={() => setDeliveryMethod(m.id)} />
                <span style={{ flex: 1 }}>
                  <strong style={{ display: "flex", justifyContent: "space-between" }}><span>{m.label}</span><span>{m.fee === 0 ? "Free" : formatCurrency(m.fee)}</span></strong>
                  <small>{m.note}</small>
                </span>
              </label>
            ))}
          </div>

          <div className="panel">
            <h3>Payment</h3>
            <div className="pay-option on">
              <Landmark size={18} style={{ marginTop: 2, color: "var(--accent)", flexShrink: 0 }} />
              <span>
                <strong>Pay by bank transfer</strong>
                <small>After you place the order you'll see our bank details. Transfer the exact total, upload your receipt and tap “I have paid”. Your order is confirmed once we see your transfer.</small>
              </span>
            </div>
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "12px 0" }}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ marginTop: 4 }} />
            <span>I have read and accept the <button type="button" className="btn-link" onClick={() => setLegalDoc("terms")}>terms &amp; delivery policy</button>, and I understand payment is by bank transfer.</span>
          </label>

          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn-gold" disabled={!accepted}><Check size={16} /> Make payment</button>
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
          <div className="summary-row"><span>Processing fee</span><span>{formatCurrency(PROCESSING_FEE)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}</span></div>
          <div className="summary-row summary-total"><span>{couponCode ? "To pay now (before code)" : "To pay now"}</span><span>{formatCurrency(subtotal + PROCESSING_FEE + deliveryFee)}</span></div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>You'll get our bank details on the next screen.</p>
        </aside>
      </div>
      <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
