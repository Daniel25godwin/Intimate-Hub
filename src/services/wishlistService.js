import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/config";

export async function getWishlistIds(uid) {
  const snap = await getDoc(doc(db, "wishlists", uid));
  return snap.exists() ? snap.data().productIds || [] : [];
}

export async function toggleWishlist(uid, productId, on) {
  await setDoc(doc(db, "wishlists", uid), { productIds: on ? arrayUnion(productId) : arrayRemove(productId) }, { merge: true });
}
