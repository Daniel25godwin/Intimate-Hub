import { createHash } from "node:crypto";
import { adminDb } from "./firebaseAdmin.js";

// Returns true if this send is allowed (and records it), false if too soon.
export async function allowSend(key, cooldownMs) {
  const id = createHash("sha256").update(key).digest("hex");
  const ref = adminDb.collection("mailThrottle").doc(id);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const last = snap.exists ? snap.data().lastSentAt : 0;
    if (Date.now() - last < cooldownMs) return false;
    tx.set(ref, { lastSentAt: Date.now() });
    return true;
  });
}
