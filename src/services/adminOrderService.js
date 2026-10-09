import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

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

// Goes through the server so the customer's "order confirmed" email is sent.
// Returns { ok, emailed, emailFailed }.
export async function updateOrder(orderId, changes) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch("/api/admin/update-order", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, ...changes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Could not update the order");
  return data;
}

export async function listOrdersByCustomer(uid) {
  const q = query(collection(db, "orders"), where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(withId);
}
