import { adminAuth, verifyRequestUser } from "../_lib/firebaseAdmin.js";
import { sendMail, verificationEmail, toAppLink } from "../_lib/mailer.js";
import { allowSend } from "../_lib/throttle.js";

// POST /api/auth/send-verification  (needs the user's ID token)
// The recipient comes from the token, never from the request body.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const caller = await verifyRequestUser(req);
  if (!caller?.email) return res.status(401).json({ message: "Sign in required" });
  if (caller.email_verified) return res.status(200).json({ ok: true, alreadyVerified: true });

  if (!(await allowSend(`verify:${caller.uid}`, 25_000))) {
    return res.status(429).json({ message: "Please wait a moment before requesting another email" });
  }

  try {
    const link = toAppLink(await adminAuth.generateEmailVerificationLink(caller.email));
    await sendMail({ to: caller.email, ...verificationEmail(link) });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-verification failed:", err);
    return res.status(500).json({ message: "Couldn't send the email. Please try again." });
  }
}
