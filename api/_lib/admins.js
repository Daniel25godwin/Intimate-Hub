import { adminAuth } from "./firebaseAdmin.js";

// Email addresses of every account with the admin role.
export async function listAdminEmails() {
  const emails = [];
  let pageToken;
  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    for (const u of page.users) if (u.customClaims?.role === "admin" && u.email) emails.push(u.email);
    pageToken = page.pageToken;
  } while (pageToken);
  return emails;
}
