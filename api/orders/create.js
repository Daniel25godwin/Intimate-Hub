import { adminDb, verifyRequestUser } from "../_lib/firebaseAdmin.js";

// POST /api/orders/create
// Body: { items: [{ productId, qty, variant }], deliveryAddress, couponCode, guestEmail? }
//
// The client sends WHAT to buy (product ids + quantities). It never sends
// prices or totals — those are always re-read from Firestore here, inside a
// transaction, so a tampered client request can't create a cheap order or
// oversell stock.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const decodedUser = await verifyRequestUser(req); // null = guest checkout

  const { items, deliveryAddress, couponCode } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }
  if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
    return res.status(400).json({ message: "Delivery address is required" });
  }

  try {
    const orderRef = adminDb.collection("orders").doc();

    const result = await adminDb.runTransaction(async (tx) => {
      let subtotal = 0;
      const resolvedItems = [];

      for (const item of items) {
        const productRef = adminDb.collection("products").doc(item.productId);
        const productSnap = await tx.get(productRef);

        if (!productSnap.exists) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const product = productSnap.data();

        if (!product.isEnabled) {
          throw new Error(`${product.name} is not available`);
        }
        if (product.stock < item.qty) {
          throw new Error(`${product.name} is out of stock`);
        }

        const unitPrice = product.discountPrice ?? product.price;
        subtotal += unitPrice * item.qty;

        resolvedItems.push({
          productId: item.productId,
          name: product.name,
          qty: item.qty,
          price: unitPrice,
          variant: item.variant || null,
        });

        tx.update(productRef, { stock: product.stock - item.qty });
      }

      // TODO (Phase 2): resolve couponCode against /coupons here and apply
      // discount server-side too — never trust a client-supplied discount.
      const discount = 0;
      const deliveryFee = 1500; // TODO: pull from settings/store by zone
      const total = subtotal - discount + deliveryFee;

      const orderNumber = `IH-${Date.now().toString().slice(-8)}`;

      tx.set(orderRef, {
        userId: decodedUser?.uid || null,
        orderNumber,
        items: resolvedItems,
        subtotal,
        discount,
        deliveryFee,
        total,
        couponCode: couponCode || null,
        status: "pending",
        paymentStatus: "unpaid",
        paymentRef: null,
        deliveryAddress,
        packaging: "discreet",
        createdAt: new Date(),
        statusHistory: [{ status: "pending", at: new Date() }],
      });

      return { orderId: orderRef.id, orderNumber, total };
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Order could not be created" });
  }
}
