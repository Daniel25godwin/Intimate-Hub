import { auth } from "../firebase/config";
import { uploadImage } from "./imageService";

// Customer uploaded a receipt and tapped "I have paid": tells us (and, by email, the admins).
// `k` is the order's access key (guests); signed-in owners don't need it.
export async function submitPaymentProof(orderId, file, k) {
  const proofUrl = await uploadImage(file, "payment-proofs", { orderId, k });
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const res = await fetch("/api/payments/submit-proof", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ orderId, proofUrl, k }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

// Read an order with its access key (how guests, and anyone with the email link, view it).
export async function getOrderByKey(orderId, k) {
  const res = await fetch(`/api/orders/get?id=${encodeURIComponent(orderId)}&k=${encodeURIComponent(k)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Order not found");
  return data;
}
