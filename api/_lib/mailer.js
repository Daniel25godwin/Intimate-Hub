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

const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

function orderLayout({ heading, intro, rows = [], buttonLabel, link, outro }) {
  const rowsHtml = rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#666">${escapeHtml(k)}</td><td style="padding:6px 0;text-align:right"><strong>${escapeHtml(v)}</strong></td></tr>`)
    .join("");
  const button = link
    ? `<p style="margin:24px 0"><a href="${escapeHtml(link)}" style="background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(buttonLabel)}</a></p>`
    : "";
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#222">
    <h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>
    <p style="line-height:1.5">${intro}</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;border-bottom:1px solid #eee">${rowsHtml}</table>
    ${button}
    <p style="font-size:13px;color:#666;line-height:1.5">${outro || ""}</p>
  </div>`;
}

// To the customer right after they place the order: how to pay.
export const orderReceivedEmail = ({ name, order, bank, link }) => ({
  subject: `We have your order ${order.orderNumber} — ${APP_NAME}`,
  html: orderLayout({
    heading: `Thanks, ${name || "there"} — we have your order`,
    intro: `Your order is <strong>not confirmed until we see your transfer</strong>. Send the exact amount below and use the order number as the narration. Then upload your receipt on the order page and tap “I have paid”.`,
    rows: [
      ["Order", order.orderNumber],
      ["Amount to transfer", naira(order.total)],
      ["Narration", order.orderNumber],
      ["Delivery", order.deliveryMethodLabel || "—"],
      ["Bank", bank.bankName],
      ["Account number", bank.accountNumber],
      ["Account name", bank.accountName],
    ],
    buttonLabel: "Upload payment proof",
    link,
    outro: "If you didn't place this order, you can ignore this email.",
  }),
  text: `We have your order ${order.orderNumber}. It is not confirmed until we see your transfer.\nAmount: ${naira(order.total)}\nNarration: ${order.orderNumber}\n${bank.bankName} ${bank.accountNumber} (${bank.accountName})\nUpload your receipt: ${link}`,
});

// To every admin when a customer says they've paid.
export const adminPaymentAlertEmail = ({ order, link }) => ({
  subject: `Payment to check — ${order.orderNumber} (${naira(order.total)})`,
  html: orderLayout({
    heading: "A customer says they've paid",
    intro: "Please check your bank account for this transfer, then open the order and confirm it (or update it).",
    rows: [
      ["Order", order.orderNumber],
      ["Amount", naira(order.total)],
      ["Customer", order.deliveryAddress?.recipientName || order.contactEmail || "—"],
      ["Phone", order.deliveryAddress?.phone || "—"],
      ["Email", order.contactEmail || "—"],
    ],
    buttonLabel: "Review order",
    link,
    outro: "Their payment proof is attached to the order. Once you confirm, the customer is emailed automatically.",
  }),
  text: `${order.orderNumber} — ${naira(order.total)}. A customer says they've paid. Check your bank, then update the order: ${link}`,
});

// To the customer once an admin has confirmed the order.
export const orderConfirmedEmail = ({ name, order, link }) => ({
  subject: `Order ${order.orderNumber} confirmed — ${APP_NAME}`,
  html: orderLayout({
    heading: "Your order is confirmed",
    intro: `Hi ${escapeHtml(name || "there")}, we've received your payment and your order is confirmed. We'll be in touch about delivery.`,
    rows: [
      ["Order", order.orderNumber],
      ["Total paid", naira(order.total)],
    ],
    buttonLabel: "View your order",
    link,
    outro: `Thank you for shopping with ${APP_NAME}.`,
  }),
  text: `Your order ${order.orderNumber} is confirmed. Total paid ${naira(order.total)}. View it: ${link}`,
});

// To the customer when an admin couldn't match their transfer.
export const paymentNotFoundEmail = ({ name, order, reason, link }) => ({
  subject: `We couldn't confirm your payment for ${order.orderNumber} — ${APP_NAME}`,
  html: orderLayout({
    heading: "We couldn't confirm your payment",
    intro: `Hi ${escapeHtml(name || "there")}, we couldn't match a transfer to your order yet.${reason ? ` <strong>Note from us:</strong> ${escapeHtml(reason)}` : ""} Please check the amount and narration, then upload your receipt again.`,
    rows: [
      ["Order", order.orderNumber],
      ["Amount to transfer", naira(order.total)],
      ["Narration", order.orderNumber],
    ],
    buttonLabel: "Upload receipt again",
    link,
    outro: "If you've already paid, reply with your receipt and we'll sort it out.",
  }),
  text: `We couldn't confirm your payment for ${order.orderNumber}.${reason ? ` Note: ${reason}` : ""} Upload your receipt again: ${link}`,
});
