import { Resend } from "resend";

const APP_NAME = "Perfect Touch";

const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout({ heading, intro, buttonLabel, link, outro }) {
  const safeLink = escapeHtml(link);
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
    <h2 style="margin:0 0 12px">${heading}</h2>
    <p style="line-height:1.5">${intro}</p>
    <p style="margin:24px 0">
      <a href="${safeLink}" style="background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${buttonLabel}</a>
    </p>
    <p style="font-size:13px;color:#666;line-height:1.5">If the button doesn't work, copy this link into your browser:<br>${safeLink}</p>
    <p style="font-size:13px;color:#666">${outro}</p>
  </div>`;
}

// Needs RESEND_API_KEY and MAIL_FROM (e.g. "Perfect Touch <no-reply@perfecttouch.online>").
export async function sendMail({ to, subject, html, text }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: process.env.MAIL_FROM, to, subject, html, text });
  if (error) throw new Error(error.message);
}

// Turns Firebase's generated link into a link on your own domain (APP_URL),
// handled by the /auth/action page in the app.
export function toAppLink(firebaseLink) {
  const u = new URL(firebaseLink);
  const mode = u.searchParams.get("mode");
  const oobCode = u.searchParams.get("oobCode");
  return `${process.env.APP_URL}/auth/action?mode=${mode}&oobCode=${encodeURIComponent(oobCode)}`;
}

export const verificationEmail = (link) => ({
  subject: `Verify your email for ${APP_NAME}`,
  html: layout({
    heading: "Verify your email",
    intro: `Thanks for signing up to ${APP_NAME}. Confirm your email address to start shopping.`,
    buttonLabel: "Verify email",
    link,
    outro: "If you didn't create an account, you can ignore this email.",
  }),
  text: `Verify your email for ${APP_NAME}:\n${link}\n\nIf you didn't create an account, ignore this email.`,
});

export const passwordResetEmail = (link) => ({
  subject: `Reset your ${APP_NAME} password`,
  html: layout({
    heading: "Reset your password",
    intro: "We received a request to reset your password. Click below to choose a new one.",
    buttonLabel: "Reset password",
    link,
    outro: "If you didn't request this, you can ignore this email.",
  }),
  text: `Reset your ${APP_NAME} password:\n${link}\n\nIf you didn't request this, ignore this email.`,
});
