import { adminDb, verifyRequestUser } from "../_lib/firebaseAdmin.js";
import { paystackInitialize } from "../_lib/paystack.js";

// POST /api/payments/initialize   Body: { orderId }
// The amount always comes from the saved order, never from the browser.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ message: "Order id is required" });

  try {
    const orderRef = adminDb.collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) return res.status(404).json({ message: "Order not found" });
    const order = snap.data();

    const user = await verifyRequestUser(req); // null = guest
    if (order.userId && user?.uid !== order.userId) return res.status(403).json({ message: "Not your order" });

    if (order.paymentMethod !== "online") return res.status(400).json({ message: "This order isn't set to pay online" });
    if (order.paymentStatus === "paid") return res.status(400).json({ message: "This order is already paid" });
    if (order.status === "cancelled") return res.status(400).json({ message: "This order was cancelled" });
    if (!(order.total > 0)) return res.status(400).json({ message: "Nothing to pay" });

    const email = order.contactEmail || user?.email;
    if (!email) return res.status(400).json({ message: "An email address is needed to pay online" });

    // New reference each attempt so a customer can retry after a failed/abandoned payment.
    const reference = `${order.orderNumber}-${Date.now().toString(36)}`;
    // Where Paystack sends the customer back. Uses APP_URL if set; otherwise works out
    // the address from the request (http on localhost, https everywhere else).
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || (/^(localhost|127\.)/.test(host) ? "http" : "https");
    const appUrl = (process.env.APP_URL || `${proto}://${host}`).replace(/\/$/, "");

    const data = await paystackInitialize({
      email,
      amountNaira: order.total,
      reference,
      callbackUrl: `${appUrl}/payment/callback`,
      metadata: { orderId, orderNumber: order.orderNumber },
    });

    await orderRef.update({ paymentRef: reference });
    return res.status(200).json({ url: data.authorization_url, reference });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Could not start payment" });
  }
}
