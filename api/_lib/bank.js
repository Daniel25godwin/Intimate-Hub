import { adminDb } from "./firebaseAdmin.js";

// Bank details are edited by admins in Settings → Bank account (Firestore doc settings/payment).
// If that hasn't been filled in yet, fall back to env vars, then to these defaults.
export async function bankDetails() {
  let saved = {};
  try {
    const snap = await adminDb.collection("settings").doc("payment").get();
    saved = snap.exists ? snap.data() : {};
  } catch (err) {
    console.error("Could not read bank settings", err);
  }
  return {
    bankName: saved.bankName || process.env.BANK_NAME || "Moniepoint",
    accountNumber: saved.accountNumber || process.env.BANK_ACCOUNT_NUMBER || "8138275031",
    accountName: saved.accountName || process.env.BANK_ACCOUNT_NAME || "Oluewu Sandra Ivie",
  };
}
