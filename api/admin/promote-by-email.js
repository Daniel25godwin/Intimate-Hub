import { adminAuth, verifyRequestUser } from "../_lib/firebaseAdmin.js";

// POST /api/admin/promote-by-email
// Body: { email, makeAdmin: true|false }
// Only an existing admin can call this. Looks the account up by email so the
// caller never needs to know a Firebase uid.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const caller = await verifyRequestUser(req);
  if (!caller || caller.role !== "admin") return res.status(403).json({ message: "Admin only" });

  const { email, makeAdmin } = req.body || {};
  if (!email) return res.status(400).json({ message: "email is required" });

  if (!makeAdmin && email.toLowerCase() === caller.email?.toLowerCase()) {
    return res.status(400).json({ message: "You can't remove your own admin access" });
  }

  let user;
  try {
    user = await adminAuth.getUserByEmail(email.trim());
  } catch {
    return res.status(404).json({ message: "No account found with that email. They need to sign up first." });
  }

  await adminAuth.setCustomUserClaims(user.uid, { role: makeAdmin ? "admin" : null });
  return res.status(200).json({ ok: true, uid: user.uid, email: user.email });
}
