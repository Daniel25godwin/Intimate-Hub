import { adminDb, verifyRequestUser } from "../_lib/firebaseAdmin.js";
import { sendMail, orderConfirmedEmail, paymentNotFoundEmail } from "../_lib/mailer.js";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

// POST /api/admin/update-order   (admin only)
// Body: { orderId, status?, confirmPayment?: true }
// Updating the order is what triggers the customer's "order confirmed" email —
// once per order, the first time it becomes confirmed (or later).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const caller = await verifyRequestUser(req);
  if (!caller || caller.role !== "admin") return res.status(403).json({ message: "Admin only" });

  const { orderId, status, confirmPayment, rejectPayment, reason } = req.body || {};
  if (!orderId) return res.status(400).json({ message: "orderId is required" });
  if (status && !STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });
  if (!status && !confirmPayment && !rejectPayment) return res.status(400).json({ message: "Nothing to update" });

  const ref = adminDb.collection("orders").doc(orderId);
  if (rejectPayment) return rejectProof(ref, orderId, reason, res);
  let order;
  let shouldEmail = false;
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Order not found");
      order = snap.data();

      const update = {};
      const history = [...(order.statusHistory || [])];
      let newStatus = order.status;

      if (confirmPayment) {
        update.paymentStatus = "paid";
        update.paidAt = new Date();
        update.paymentConfirmedBy = caller.email || caller.uid;
        newStatus = order.status === "pending" ? "confirmed" : order.status;
        history.push({ status: newStatus, at: new Date(), note: "Payment confirmed. Your order is confirmed." });
      }
      if (status && status !== newStatus) {
        newStatus = status;
        history.push({ status, at: new Date() });
      }
      update.status = newStatus;
      update.statusHistory = history;

      // Email once, the first time the order is confirmed (or beyond), never for cancelled/pending.
      shouldEmail = !order.confirmationEmailSentAt && !["pending", "cancelled"].includes(newStatus);
      tx.update(ref, update);
      order = { ...order, ...update };
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  let emailed = false;
  if (shouldEmail && order.contactEmail) {
    try {
      const mail = orderConfirmedEmail({
        name: order.deliveryAddress?.recipientName,
        order,
        link: `${process.env.APP_URL}/order-confirmation/${orderId}`,
      });
      await sendMail({ to: order.contactEmail, ...mail });
      await ref.update({ confirmationEmailSentAt: new Date() });
      emailed = true;
    } catch (err) {
      console.error("Order confirmed email failed", err);
    }
  }
  return res.status(200).json({ ok: true, emailed, emailFailed: shouldEmail && !emailed });
}

// "We couldn't find this payment": clears the receipt so the customer can pay/upload again.
async function rejectProof(ref, orderId, reason, res) {
  const note = (reason || "").toString().slice(0, 300);
  let order;
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Order not found");
      order = snap.data();
      if (order.paymentStatus === "paid") throw new Error("This order is already marked paid");
      if (order.status === "cancelled") throw new Error("This order is cancelled");
      tx.update(ref, {
        paymentStatus: "unpaid",
        paymentProofUrl: null,
        paymentRejectedAt: new Date(),
        statusHistory: [
          ...(order.statusHistory || []),
          { status: order.status, at: new Date(), note: `We couldn't match your payment yet.${note ? ` ${note}` : ""} Please check and upload your receipt again.` },
        ],
      });
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
  let emailed = false;
  if (order.contactEmail) {
    try {
      await sendMail({
        to: order.contactEmail,
        ...paymentNotFoundEmail({ name: order.deliveryAddress?.recipientName, order, reason: note, link: `${process.env.APP_URL}/order-confirmation/${orderId}` }),
      });
      emailed = true;
    } catch (err) { console.error("Payment-not-found email failed", err); }
  }
  return res.status(200).json({ ok: true, emailed, rejected: true });
}
