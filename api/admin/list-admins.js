import { adminAuth, verifyRequestUser } from "../_lib/firebaseAdmin.js";

// GET /api/admin/list-admins — admin only
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const caller = await verifyRequestUser(req);
  if (!caller || caller.role !== "admin") return res.status(403).json({ message: "Admin only" });

  const admins = [];
  let pageToken;
  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    admins.push(
      ...page.users
        .filter((u) => u.customClaims?.role === "admin")
        .map((u) => ({ uid: u.uid, email: u.email, displayName: u.displayName || "" }))
    );
    pageToken = page.pageToken;
  } while (pageToken);

  return res.status(200).json({ admins });
}
