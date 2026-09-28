import {
  collection, query, where, limit, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const productsRef = collection(db, "products");
const withId = (d) => ({ id: d.id, ...d.data() });

// ---- Storefront (enabled products only; rules require the isEnabled filter) ----
export async function getEnabledProducts() {
  const snap = await getDocs(query(productsRef, where("isEnabled", "==", true)));
  return snap.docs.map(withId);
}

export async function getFeaturedProducts(max = 8) {
  const snap = await getDocs(
    query(productsRef, where("isEnabled", "==", true), where("isFeatured", "==", true), limit(max))
  );
  return snap.docs.map(withId);
}

export async function getProductBySlug(slug) {
  const snap = await getDocs(
    query(productsRef, where("isEnabled", "==", true), where("slug", "==", slug), limit(1))
  );
  return snap.empty ? null : withId(snap.docs[0]);
}

// ---- Admin ----
export async function getAllProducts() {
  const snap = await getDocs(productsRef);
  return snap.docs.map(withId);
}

export async function getProductById(id) {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? withId(snap) : null;
}

export const createProduct = (data) =>
  addDoc(productsRef, { ...data, ratingAvg: 0, ratingCount: 0, createdAt: serverTimestamp() });
export const updateProduct = (id, data) => updateDoc(doc(db, "products", id), data);
export const deleteProduct = (id) => deleteDoc(doc(db, "products", id));
