/**
 * Run this ONCE, locally, to promote the very first admin account.
 * Never deploy this file or commit the service account JSON it reads.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/bootstrap-admin.js someone@example.com
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/bootstrap-admin.js <email>");
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const auth = getAuth();

const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: "admin" });

console.log(`${email} (${user.uid}) is now an admin. They must sign out/in again to refresh their token.`);
