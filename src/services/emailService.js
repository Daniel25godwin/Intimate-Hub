import { auth } from "../firebase/config";

async function post(path, body, token) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || "Couldn't send the email. Please try again.");
    // Same code Firebase used, so VerifyEmail's rate-limit message still works.
    err.code = res.status === 429 ? "auth/too-many-requests" : "email/send-failed";
    throw err;
  }
}

export async function sendVerificationEmail() {
  const token = await auth.currentUser.getIdToken();
  await post("/api/auth/send-verification", null, token);
}

export const sendPasswordReset = (email) => post("/api/auth/send-password-reset", { email });
