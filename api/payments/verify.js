import { paystackVerify, settleOrder } from "../_lib/paystack.js";

// GET /api/payments/verify?reference=...
// Called when the customer lands back on the site after paying.
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const reference = req.query?.reference;
  if (!reference) return res.status(400).json({ message: "Missing payment reference" });

  try {
    const txn = await paystackVerify(reference);
    const result = await settleOrder(txn);
    return res.status(200).json({
      paid: result.ok,
      orderId: result.orderId || txn.metadata?.orderId || null,
      orderNumber: result.orderNumber || null,
      total: result.total ?? null,
      status: txn.status,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Could not verify payment" });
  }
}
