import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

const ref = collection(db, "categories");

export async function listCategories() {
  const snap = await getDocs(ref);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export const createCategory = (data) => addDoc(ref, data);
export const updateCategory = (id, data) => updateDoc(doc(db, "categories", id), data);
export const deleteCategory = (id) => deleteDoc(doc(db, "categories", id));
