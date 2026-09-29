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

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Couldn't reach the server. If you're running `npm run dev`, use `vercel dev` instead — /api routes need it.");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create order");
  return data; // { orderId, orderNumber, total }
}
