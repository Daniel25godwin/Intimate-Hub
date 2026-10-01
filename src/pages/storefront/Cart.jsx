import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { previewCoupon } from "../../services/couponService";
import { formatCurrency } from "../../utils/format";
import CheckoutSteps from "../../components/storefront/CheckoutSteps";

const DELIVERY_FEE = 0; // free delivery — must match the fee set in /api/orders/create

export default function Cart() {
  const { items, setQty, removeItem, subtotal } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState("");
  const [checking, setChecking] = useState(false);

  async function applyCoupon(e) {
    e.preventDefault();
    setCouponError("");
    if (!code.trim()) return;
    setChecking(true);
    try {
      setCoupon(await previewCoupon(code, subtotal));
    } catch (err) {
      setCoupon(null);
      setCouponError(err.message);
    } finally {
      setChecking(false);
    }
  }

  // Guests create an account first; the cart is kept, and they return to checkout afterwards.
  function goCheckout() {
    try { coupon ? sessionStorage.setItem("ih_coupon", coupon.code) : sessionStorage.removeItem("ih_coupon"); } catch { /* ignore */ }
    if (user) navigate("/checkout", { state: { couponCode: coupon?.code || null } });
    else navigate("/register", { state: { from: { pathname: "/checkout" } } });
  }

  const discount = coupon?.discount || 0;
  const total = subtotal - discount + (items.length ? DELIVERY_FEE : 0);

  if (items.length === 0) {
    return (
      <div className="section empty">
        <div className="empty-icon"><ShoppingBag size={26} /></div>
        <h1>Your cart is empty</h1>
        <p className="muted">Find something you like and it will show up here.</p>
        <Link to="/shop" className="btn">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="section">
      <CheckoutSteps current={1} />
      <div className="cart-layout">
        <div>
          <h1>Your cart</h1>
          {items.map((i) => (
            <div key={`${i.productId}::${i.variant || ""}`} className="cart-line">
              {i.image ? <img src={i.image} alt="" /> : <div className="cart-img" />}
              <div className="cart-line-body">
                <div className="cart-line-top">
                  <div className="cart-line-info">
                    <strong>{i.name}</strong>
                    {i.variant && <span className="muted"> — {i.variant}</span>}
                    <p className="muted">{formatCurrency(i.price)} each</p>
                  </div>
                  <button className="cart-remove" onClick={() => removeItem(i.productId, i.variant)} aria-label={`Remove ${i.name}`}>×</button>
                </div>
                <div className="cart-line-bottom">
                  <div className="qty-stepper">
                    <button onClick={() => setQty(i.productId, i.variant, i.qty - 1)} disabled={i.qty <= 1} aria-label="Decrease quantity">−</button>
                    <span>{i.qty}</span>
                    <button onClick={() => setQty(i.productId, i.variant, i.qty + 1)} aria-label="Increase quantity">+</button>
                  </div>
                  <strong>{formatCurrency(i.price * i.qty)}</strong>
                </div>
              </div>
            </div>
          ))}
          <p style={{ marginTop: 18 }}><Link to="/shop">← Continue shopping</Link></p>
        </div>

        <aside className="cart-summary">
          <h3>Order summary</h3>
          {coupon ? (
            <p className="notice">Code <strong>{coupon.code}</strong> applied.{" "}
              <button className="link-btn" type="button" onClick={() => { setCoupon(null); setCode(""); }}>Remove</button></p>
          ) : (
            <form onSubmit={applyCoupon} className="row">
              <input placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Promo code" />
              <button disabled={checking}>{checking ? "Checking…" : "Apply"}</button>
            </form>
          )}
          {couponError && <p className="error" role="alert">{couponError}</p>}

          <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {discount > 0 && <div className="summary-row"><span>Discount</span><span>−{formatCurrency(discount)}</span></div>}
          <div className="summary-row"><span>Delivery</span><span>{DELIVERY_FEE === 0 ? "Free" : formatCurrency(DELIVERY_FEE)}</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{formatCurrency(total)}</span></div>

          <button className="btn" style={{ width: "100%" }} onClick={goCheckout}>
            {user ? "Continue to checkout" : "Sign up to check out"}
          </button>
          {!user && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>It's free and quick. Your cart is saved, and you can track your order afterwards.</p>}
          <p className="muted" style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>Free delivery on every order.</p>
        </aside>
      </div>
    </div>
  );
}
