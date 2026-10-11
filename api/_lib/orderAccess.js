import { randomBytes, timingSafeEqual } from "node:crypto";

// Guests have no account, so each order gets a long random key. Whoever has the
// link (…/order-confirmation/<id>?k=<key>) can view the order and tell us they've paid.
export const newAccessToken = () => randomBytes(16).toString("hex");

export function tokenMatches(order, k) {
  if (!order?.accessToken || typeof k !== "string" || k.length !== order.accessToken.length) return false;
  return timingSafeEqual(Buffer.from(order.accessToken), Buffer.from(k));
}

// Who may act on this order: its signed-in owner, or anyone holding the key.
export function canAccess(order, caller, k) {
  if (caller && order.userId && order.userId === caller.uid) return true;
  return tokenMatches(order, k);
}

export const orderLink = (id, order) =>
  `${process.env.APP_URL}/order-confirmation/${id}${order.accessToken ? `?k=${order.accessToken}` : ""}`;

const ser = (v) => {
  if (v && typeof v.toDate === "function") return { seconds: Math.floor(v.toDate().getTime() / 1000) };
  if (Array.isArray(v)) return v.map(ser);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ser(x)]));
  return v;
};

// Safe-to-send copy of an order (no key, no user id), with timestamps as { seconds }.
export function publicOrder(id, order) {
  const { accessToken, userId, ...rest } = order;
  return { id, ...ser(rest) };
}
