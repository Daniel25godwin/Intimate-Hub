import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/config";

const withId = (d) => ({ id: d.id, ...d.data() });

export async function listOrders() {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(withId);
}

export async function getOrder(id) {
  const snap = await getDoc(doc(db, "orders", id));
  return snap.exists() ? withId(snap) : null;
}

export async function setOrderStatus(id, status) {
  await updateDoc(doc(db, "orders", id), {
    status,
    statusHistory: arrayUnion({ status, at: new Date() }),
  });
}

export async function listOrdersByCustomer(uid) {
  const q = query(collection(db, "orders"), where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(withId);
}
