import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { auth, db } from "../firebase/config";

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : {};
}

// Security rules only let customers change displayName, phone and defaultAddressId.
export async function saveProfile(uid, { displayName, phone }) {
  await updateDoc(doc(db, "users", uid), { displayName, phone });
  if (auth.currentUser) await updateAuthProfile(auth.currentUser, { displayName }).catch(() => {});
}

export async function listAddresses(uid) {
  const snap = await getDocs(collection(db, "users", uid, "addresses"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveAddress(uid, id, data) {
  if (id) { await setDoc(doc(db, "users", uid, "addresses", id), data); return id; }
  const ref = await addDoc(collection(db, "users", uid, "addresses"), data);
  return ref.id;
}

export const deleteAddress = (uid, id) => deleteDoc(doc(db, "users", uid, "addresses", id));
export const setDefaultAddress = (uid, id) => updateDoc(doc(db, "users", uid), { defaultAddressId: id });

// Used by checkout to pre-fill the form for signed-in customers.
export async function getCheckoutDefaults(uid) {
  const profile = await getProfile(uid);
  let a = {};
  if (profile.defaultAddressId) {
    const snap = await getDoc(doc(db, "users", uid, "addresses", profile.defaultAddressId));
    if (snap.exists()) a = snap.data();
  }
  return { name: a.recipientName || profile.displayName, phone: a.phone || profile.phone, street: a.street, city: a.city, state: a.state };
}
