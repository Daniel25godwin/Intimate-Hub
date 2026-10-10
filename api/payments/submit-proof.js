import { adminDb, verifyRequestUser } from "../_lib/firebaseAdmin.js";
import { listAdminEmails } from "../_lib/admins.js";
import { sendMail, adminPaymentAlertEmail } from "../_lib/mailer.js";
import { canAccess } from "../_lib/orderAccess.js";
import { runInBackground } from "../_lib/background.js";

// POST /api/payments/submit-proof   Body: { orderId, proofUrl, k? }
// Signed-in owner, or a guest holding the order's access key (k).
// The customer uploaded a receipt and tapped "I have paid". We flag the order
// as awaiting confirmation and email every admin to go and check their bank.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const caller = await verifyRequestUser(req);
  const { orderId, proofUrl, k } = req.body || {};
  if (!orderId || !proofUrl) return res.status(400).json({ message: "orderId and proofUrl are required" });
  // Proofs are uploaded to our Cloudinary account — don't accept arbitrary links.
  const okHost = new RegExp(`^https://res\\.cloudinary\\.com/${process.env.CLOUDINARY_CLOUD_NAME}/`);
  if (!okHost.test(proofUrl)) return res.status(400).json({ message: "Invalid proof file" });

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
      const update = { paymentProofUrl: proofUrl, paymentStatus: "awaiting_confirmation" };
      if (firstTime) {
        update.paymentClaimedAt = new Date();
        update.statusHistory = [
          ...(order.statusHistory || []),
          { status: order.status, at: new Date(), note: "Payment proof received. We're checking your transfer." },
        ];
      }
      tx.update(ref, update);
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  // Alert admins only the first time, so re-uploading a clearer receipt doesn't spam them.
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
