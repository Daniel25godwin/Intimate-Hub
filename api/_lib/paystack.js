import crypto from "crypto";
import { adminDb } from "./firebaseAdmin.js";

const BASE = "https://api.paystack.co";
const authHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
});

// Start a payment. Amount is in naira here; Paystack wants kobo.
export async function paystackInitialize({ email, amountNaira, reference, callbackUrl, metadata }) {
  const r = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      amount: Math.round(amountNaira * 100),
      currency: "NGN",
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.status) throw new Error(j.message || "Could not start payment");
  return j.data; // { authorization_url, access_code, reference }
}

// Ask Paystack directly what happened to a payment. Never trust the browser's word for it.
export async function paystackVerify(reference) {
  const r = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, { headers: authHeaders() });
  const j = await r.json();
  if (!r.ok || !j.status) throw new Error(j.message || "Could not verify payment");
  return j.data;
}

// Webhook signature check (HMAC SHA-512 of the raw request body).
export function validSignature(rawBody, signature) {
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Marks the order paid ONLY if Paystack confirms a successful payment of the
// exact order total in NGN. Safe to call repeatedly (verify + webhook both use it).
export async function settleOrder(txn) {
  const orderId = txn?.metadata?.orderId;
  if (!orderId || txn.status !== "success") return { ok: false, orderId };

  const ref = adminDb.collection("orders").doc(orderId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, orderId };
    const order = snap.data();
    const summary = { orderId, orderNumber: order.orderNumber, total: order.total };

    if (txn.currency !== "NGN" || txn.amount !== Math.round(order.total * 100)) {
      console.error("Payment amount mismatch", { orderId, paid: txn.amount, expected: order.total * 100 });
      return { ok: false, ...summary, reason: "amount_mismatch" };
    }
    if (order.paymentStatus === "paid") return { ok: true, ...summary };

    tx.update(ref, { paymentStatus: "paid", paymentRef: txn.reference, paidAt: new Date() });
    return { ok: true, ...summary };
  });
}
