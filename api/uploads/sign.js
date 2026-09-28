import crypto from "crypto";
import { verifyRequestUser } from "../_lib/firebaseAdmin.js";

// POST /api/uploads/sign  (admin only)
// Returns a short-lived Cloudinary upload signature so the browser can upload
// directly to Cloudinary without ever seeing CLOUDINARY_API_SECRET.
const ALLOWED_FOLDERS = ["products", "categories", "store"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const caller = await verifyRequestUser(req);
  if (!caller || caller.role !== "admin") return res.status(403).json({ message: "Admin only" });

  const { folder } = req.body || {};
  if (!ALLOWED_FOLDERS.includes(folder)) return res.status(400).json({ message: "Invalid folder" });

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
