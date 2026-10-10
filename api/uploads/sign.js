import crypto from "crypto";
import { adminDb, verifyRequestUser } from "../_lib/firebaseAdmin.js";
import { canAccess } from "../_lib/orderAccess.js";

// POST /api/uploads/sign  (admin only, except payment-proofs)
// Returns a short-lived Cloudinary upload signature so the browser can upload
// directly to Cloudinary without ever seeing CLOUDINARY_API_SECRET.
const ALLOWED_FOLDERS = ["products", "categories", "store"];
// Any signed-in customer may upload their own payment receipt (and nothing else).
const CUSTOMER_FOLDERS = ["payment-proofs"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const caller = await verifyRequestUser(req);
  const { folder, orderId, k } = req.body || {};

  if (CUSTOMER_FOLDERS.includes(folder)) {
    // Receipts: only for someone who can act on a real, unpaid order (owner or guest with the key).
    const snap = orderId ? await adminDb.collection("orders").doc(String(orderId)).get() : null;
    if (!snap?.exists || !canAccess(snap.data(), caller, k) || snap.data().paymentStatus === "paid") {
      return res.status(403).json({ message: "You can't upload a receipt for this order" });
    }
  } else {
    if (!caller || caller.role !== "admin") return res.status(403).json({ message: "Admin only" });
    if (!ALLOWED_FOLDERS.includes(folder)) return res.status(400).json({ message: "Invalid folder" });
  }

  const fullFolder = `intimate-hub/${folder}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${fullFolder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  return res.status(200).json({
    signature,
    timestamp,
    folder: fullFolder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
