import { adminAuth } from "../_lib/firebaseAdmin.js";
import { sendMail, passwordResetEmail, toAppLink } from "../_lib/mailer.js";
import { allowSend } from "../_lib/throttle.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/send-password-reset   Body: { email }
// Public endpoint, so it answers the same way whether or not the account exists.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ message: "Please enter a valid email" });

  if (!(await allowSend(`reset:${email}`, 60_000))) {
    return res.status(429).json({ message: "Please wait a minute before trying again" });
  }

  try {
    let exists = true;
    try {
      await adminAuth.getUserByEmail(email);
    } catch {
      exists = false;
    }
    if (exists) {
      const link = toAppLink(await adminAuth.generatePasswordResetLink(email));
      await sendMail({ to: email, ...passwordResetEmail(link) });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-password-reset failed:", err);
    return res.status(500).json({ message: "Couldn't send the email. Please try again." });
  }
}
