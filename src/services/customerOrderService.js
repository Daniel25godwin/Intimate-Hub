import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

// Fetch this customer's orders. Sorting happens here in the browser (newest first)
// so Firestore doesn't need a composite index for "userId + createdAt".
export async function getMyOrders(uid) {
  const q = query(collection(db, "orders"), where("userId", "==", uid));
  const snap = await getDocs(q);
  const secs = (o) => o.createdAt?.seconds || 0;
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => secs(b) - secs(a));
}
