import { validSignature, settleOrder } from "../_lib/paystack.js";

// Paystack needs the RAW body to check the signature, so turn off body parsing.
export const config = { api: { bodyParser: false } };

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// POST /api/payments/webhook — set this URL in your Paystack dashboard.
// Safety net: marks the order paid even if the customer closes the tab before returning.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const raw = await readRaw(req);
  if (!validSignature(raw, req.headers["x-paystack-signature"])) return res.status(401).end();

  try {
    const event = JSON.parse(raw.toString("utf8"));
    if (event.event === "charge.success") await settleOrder(event.data);
  } catch (err) {
    console.error("Webhook error", err);
  }
  return res.status(200).end(); // always 200 for valid signatures so Paystack doesn't keep retrying
}
