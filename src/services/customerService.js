import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const withId = (d) => ({ id: d.id, ...d.data() });

export async function listCustomers() {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(withId);
}

export const setCustomerDisabled = (uid, isDisabled) => updateDoc(doc(db, "users", uid), { isDisabled });
