import { adminDb, verifyRequestUser } from "../_lib/firebaseAdmin.js";
import { listAdminEmails } from "../_lib/admins.js";
import { sendMail, adminPaymentAlertEmail } from "../_lib/mailer.js";
import { canAccess } from "../_lib/orderAccess.js";
import { runInBackground } from "../_lib/background.js";

// POST /api/payments/mark-paid   Body: { orderId, k? }
// The customer tapped "I have paid". Signed-in owner, or a guest holding the
// order's access key (k). We flag the order as awaiting confirmation and email
// every admin to go and check their bank.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const caller = await verifyRequestUser(req);
  const { orderId, k } = req.body || {};
  if (!orderId) return res.status(400).json({ message: "orderId is required" });

  const ref = adminDb.collection("orders").doc(orderId);
  let order;
  let firstTime = false;
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists || !canAccess(snap.data(), caller, k)) throw new Error("Order not found");
      order = snap.data();
      if (order.status === "cancelled") throw new Error("This order was cancelled");
      if (order.paymentStatus === "paid") throw new Error("This order is already paid");

      firstTime = order.paymentStatus !== "awaiting_confirmation";
      if (!firstTime) return; // already flagged — nothing to change
      tx.update(ref, {
        paymentStatus: "awaiting_confirmation",
        paymentClaimedAt: new Date(),
        statusHistory: [
          ...(order.statusHistory || []),
          { status: order.status, at: new Date(), note: "Payment notice received. We're checking for your transfer." },
        ],
      });
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  // Alert admins only the first time, so repeat taps don't spam them.
  // Sent after we answer, so the customer sees "order received" straight away.
  if (firstTime) {
    runInBackground("Admin payment alert", async () => {
      const to = await listAdminEmails();
      if (!to.length) return;
      await sendMail({ to, ...adminPaymentAlertEmail({ order, link: `${process.env.APP_URL}/admin/orders/${orderId}` }) });
    });
  }
  return res.status(200).json({ ok: true });
}
