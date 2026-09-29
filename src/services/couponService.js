import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

const ref = collection(db, "coupons");
const withId = (d) => ({ id: d.id, ...d.data() });

export async function listCoupons() {
  const snap = await getDocs(ref);
  return snap.docs.map(withId);
}

export const createCoupon = (data) => addDoc(ref, { ...data, usageCount: 0 });
export const updateCoupon = (id, data) => updateDoc(doc(db, "coupons", id), data);
export const deleteCoupon = (id) => deleteDoc(doc(db, "coupons", id));

// Preview-only — the real check/apply happens server-side in
// /api/orders/create so a client can never fake a discount.
export async function previewCoupon(code, subtotal) {
  const res = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json();
  if (!res.ok || !data.valid) throw new Error(data.message || "Invalid code");
  return data; // { valid, discount, code }
}
