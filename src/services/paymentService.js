import { auth } from "../firebase/config";

async function authHeader() {
  const token = await auth.currentUser?.getIdToken?.();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

// Returns { url } — send the customer there to pay.
export async function initializePayment(orderId) {
  const res = await fetch("/api/payments/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ orderId }),
  });
  return parse(res);
}

// Returns { paid, orderId, orderNumber, total, status }.
export async function verifyPayment(reference) {
  const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
  return parse(res);
}

// Start a payment and go to Paystack.
export async function payNow(orderId) {
  const { url } = await initializePayment(orderId);
  window.location.href = url;
}
