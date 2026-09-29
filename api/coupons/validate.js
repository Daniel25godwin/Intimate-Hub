import { adminDb } from "../_lib/firebaseAdmin.js";
import { computeDiscount } from "../_lib/couponLogic.js";

// POST /api/coupons/validate  Body: { code, subtotal }
// Public (no auth needed — guests can use coupons too), but never returns the
// full coupon list, only the outcome for one code.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { code, subtotal } = req.body || {};
  if (!code || typeof subtotal !== "number") {
    return res.status(400).json({ message: "code and subtotal are required" });
  }

  const snap = await adminDb.collection("coupons").where("code", "==", code.trim().toUpperCase()).limit(1).get();
  if (snap.empty) return res.status(404).json({ message: "Invalid code" });

  const coupon = snap.docs[0].data();
  try {
    const discount = computeDiscount(coupon, subtotal);
    return res.status(200).json({ valid: true, discount, code: coupon.code });
  } catch (err) {
    return res.status(400).json({ valid: false, message: err.message });
  }
}
