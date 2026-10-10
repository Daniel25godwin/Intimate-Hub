import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const ref = () => doc(db, "settings", "payment");

// Bank account customers transfer to. Edited in Admin → Settings.
export async function getBankSettings() {
  const snap = await getDoc(ref());
  const d = snap.exists() ? snap.data() : {};
  return { bankName: d.bankName || "", accountNumber: d.accountNumber || "", accountName: d.accountName || "" };
}

export async function saveBankSettings({ bankName, accountNumber, accountName }) {
  await setDoc(ref(), {
    bankName: bankName.trim(),
    accountNumber: accountNumber.replace(/\s+/g, ""),
    accountName: accountName.trim(),
    updatedAt: new Date(),
  }, { merge: true });
}
