import { auth } from "../firebase/config";

// Orders are never written directly to Firestore from the client — price and
// stock must be re-validated server-side. This calls the Vercel serverless
// function at /api/orders/create, which uses the firebase-admin SDK.
export async function createOrder(orderPayload) {
  const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const res = await fetch("/api/orders/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(orderPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create order");
  }

  return res.json(); // { orderId, orderNumber, total }
}
