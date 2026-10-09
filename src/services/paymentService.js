import { auth } from "../firebase/config";
import { uploadImage } from "./imageService";

// Customer uploaded a receipt and tapped "I have paid": tells us (and, by email, the admins).
export async function submitPaymentProof(orderId, file) {
  const proofUrl = await uploadImage(file, "payment-proofs");
  const token = await auth.currentUser.getIdToken();
  const res = await fetch("/api/payments/submit-proof", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, proofUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}
