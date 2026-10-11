// Display copy for checkout. The server (api/_lib/delivery.js) decides the real fees:
// keep the ids and fees in sync with it.
export const PROCESSING_FEE = 50;

export const DELIVERY_METHODS = [
  { id: "waybill", label: "Waybill Delivery", fee: 0, note: "Sent via a transport/park carrier to your town. Carrier fee (about ₦500) is to be paid before delivery." },
  { id: "rider", label: "Give to Rider", fee: 0, note: "We hand your order to a dispatch rider within Lagos. Rider fare is paid on delivery." },
  { id: "stock_piling", label: "Stock Piling (7 Days Only)", fee: 0, note: "We hold your paid items for up to 7 days while you complete your shopping, then ship together." },
  { id: "pickup", label: "Store Pickup", fee: 0, note: "Pick up from our shop in Ikorodu garage, Lagos. No delivery fee." },
];
