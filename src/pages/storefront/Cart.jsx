import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { previewCoupon } from "../../services/couponService";
import { formatCurrency } from "../../utils/format";

const DELIVERY_FEE = 1500; // matches the fallback in /api/orders/create — real fee is set there

export default function Cart() {
  const { items, setQty, removeItem, subtotal } = useCart();
  const navigate = useNavigate();
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
      const result = await previewCoupon(code, subtotal);
      setCoupon(result);
    } catch (err) {
      setCoupon(null);
      setCouponError(err.message);
    } finally {
      setChecking(false);
    }
  }

  const discount = coupon?.discount || 0;
  const total = subtotal - discount + (items.length ? DELIVERY_FEE : 0);

  if (items.length === 0) {
    return (
      <div className="section" style={{ textAlign: "center", padding: "60px 24px" }}>
        <h1>Your cart is empty</h1>
        <Link to="/shop" className="btn">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="section cart-layout">
      <div>
        <h1>Your cart</h1>
        {items.map((i) => (
          <div key={`${i.productId}::${i.variant || ""}`} className="cart-line">
            {i.image && <img src={i.image} alt="" />}
            <div className="cart-line-info">
              <strong>{i.name}</strong>
              {i.variant && <span className="muted"> — {i.variant}</span>}
              <p className="muted">{formatCurrency(i.price)} each</p>
            </div>
            <div className="qty-stepper">
              <button onClick={() => setQty(i.productId, i.variant, i.qty - 1)} disabled={i.qty <= 1}>−</button>
              <span>{i.qty}</span>
              <button onClick={() => setQty(i.productId, i.variant, i.qty + 1)}>+</button>
            </div>
            <strong>{formatCurrency(i.price * i.qty)}</strong>
            <button className="cart-remove" onClick={() => removeItem(i.productId, i.variant)} aria-label="Remove">×</button>
          </div>
        ))}
      </div>

      <aside className="cart-summary">
        <h3>Order summary</h3>
        <form onSubmit={applyCoupon} className="row">
          <input placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button disabled={checking}>{checking ? "Checking…" : "Apply"}</button>
        </form>
        {couponError && <p className="error">{couponError}</p>}
        {coupon && <p className="muted">Code {coupon.code} applied</p>}

        <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        {discount > 0 && <div className="summary-row"><span>Discount</span><span>−{formatCurrency(discount)}</span></div>}
        <div className="summary-row"><span>Delivery</span><span>{formatCurrency(DELIVERY_FEE)}</span></div>
        <div className="summary-row summary-total"><span>Total</span><span>{formatCurrency(total)}</span></div>

        <button className="btn" style={{ width: "100%" }} onClick={() => navigate("/checkout", { state: { couponCode: coupon?.code || null } })}>
          Checkout
        </button>
        <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Discreet packaging on every order.</p>
      </aside>
    </div>
  );
}
