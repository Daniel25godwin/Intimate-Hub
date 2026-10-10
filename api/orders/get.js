import { adminDb, verifyRequestUser } from "../_lib/firebaseAdmin.js";
import { canAccess, publicOrder } from "../_lib/orderAccess.js";

// GET /api/orders/get?id=<orderId>&k=<accessKey>
// How guests (and anyone with their order link) read an order. Firestore rules
// only let owners/admins read orders directly, so this checks the key instead.
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });
  const { id, k } = req.query || {};
  if (!id) return res.status(400).json({ message: "Missing order id" });

  const snap = await adminDb.collection("orders").doc(String(id)).get();
  const caller = await verifyRequestUser(req);
  // Same answer for "no such order" and "wrong key", so ids can't be probed.
  if (!snap.exists || !canAccess(snap.data(), caller, k)) return res.status(404).json({ message: "Order not found" });
  return res.status(200).json(publicOrder(snap.id, snap.data()));
}
