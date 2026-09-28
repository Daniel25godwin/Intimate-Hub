import { adminAuth, verifyRequestUser } from "../_lib/firebaseAdmin.js";

// POST /api/admin/set-claim
// Body: { targetUid, makeAdmin: true|false }
//
// Only an already-admin caller can promote/demote someone. The FIRST admin
// must be bootstrapped separately with scripts/bootstrap-admin.js (run
// locally, never deployed) — this endpoint deliberately cannot create the
// first admin from zero.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const caller = await verifyRequestUser(req);
  if (!caller || caller.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const { targetUid, makeAdmin } = req.body || {};
  if (!targetUid) {
    return res.status(400).json({ message: "targetUid is required" });
  }

  await adminAuth.setCustomUserClaims(targetUid, {
    role: makeAdmin ? "admin" : null,
  });

  return res.status(200).json({ ok: true });
}
