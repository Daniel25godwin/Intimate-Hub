// Fees live here on the server — the client only sends the delivery method id.
// Keep in sync with src/config/delivery.js (which is display only).
export const PROCESSING_FEE = Number(process.env.PROCESSING_FEE ?? 50);

export const DELIVERY_METHODS = {
  waybill: { label: "Waybill Delivery", fee: 500 },
  rider: { label: "Give to Rider", fee: 0 },
  stock_piling: { label: "Stock Piling (7 Days Only)", fee: 0 },
  pickup: { label: "Store Pickup", fee: 0 },
};
