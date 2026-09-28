import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// FIREBASE_SERVICE_ACCOUNT is a Vercel-only env var (server-side, never
// exposed to the client) holding the full service-account JSON as a string.
// This file must never be imported from any file under /src.
function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

const app = getAdminApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

// Verifies the ID token sent from the client and returns the decoded token,
// or null if missing/invalid. Use this at the top of every protected route.
export async function verifyRequestUser(req) {
  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return null;

  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}
