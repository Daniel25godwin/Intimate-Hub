import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export async function getMyOrders(uid) {
  const q = query(collection(db, "orders"), where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
