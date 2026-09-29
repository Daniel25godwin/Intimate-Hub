// Shared by /api/coupons/validate (preview) and /api/orders/create (the real
// enforcement). Both must agree, or a coupon could preview one discount and
// apply a different one at checkout.
export function computeDiscount(coupon, subtotal) {
  if (!coupon.isActive) throw new Error("This code is no longer active");
  if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) throw new Error("This code has expired");
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    throw new Error(`Add more to your cart to use this code (min. ₦${coupon.minOrderValue.toLocaleString()})`);
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) throw new Error("This code has been fully redeemed");

  const raw = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  return Math.min(Math.round(raw), subtotal);
}
