import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export async function registerUser({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    displayName: name,
    phone: "",
    role: "customer",
    isDisabled: false,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);

// Google/Facebook/Apple sign-ins can create a brand-new Auth user without a
// Firestore profile. Create it on first sign-in.
export async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    phone: "",
    role: "customer",
    isDisabled: false,
    createdAt: serverTimestamp(),
  });
}

// Email/password accounts must verify their address before using the store.
// Social providers (Google/Apple/Facebook) are treated as already verified.
export function needsVerification(user) {
  return user.providerData.some((p) => p.providerId === "password") && !user.emailVerified;
}
