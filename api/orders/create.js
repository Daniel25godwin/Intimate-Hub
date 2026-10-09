import { adminDb, verifyRequestUser } from "../_lib/firebaseAdmin.js";
import { computeDiscount } from "../_lib/couponLogic.js";
import { bankDetails } from "../_lib/bank.js";
import { PROCESSING_FEE, DELIVERY_METHODS } from "../_lib/delivery.js";
import { sendMail, orderReceivedEmail } from "../_lib/mailer.js";

// POST /api/orders/create
// Body: { items: [{ productId, qty, variant }], deliveryAddress, couponCode }
//
// The client sends WHAT to buy (product ids + quantities). It never sends
// prices or totals — those are always re-read from Firestore here, inside a
// transaction, so a tampered client request can't create a cheap order or
// oversell stock.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const decodedUser = await verifyRequestUser(req);
  if (!decodedUser) {
    return res.status(401).json({ message: "Please sign in to place an order" });
  }
  if (decodedUser.email_verified === false) {
    return res.status(403).json({ message: "Please verify your email before placing an order" });
  }
  const { items, deliveryAddress, couponCode, paymentMethod, contactEmail, deliveryMethod, acceptedTerms } = req.body || {};
  const METHODS = ["transfer"];
  if (!METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: "Please choose a payment method" });
  }

  if (!DELIVERY_METHODS[deliveryMethod]) {
    return res.status(400).json({ message: "Please choose a delivery method" });
  }
  if (acceptedTerms !== true) {
    return res.status(400).json({ message: "Please accept the terms & delivery policy" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }
  if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
    return res.status(400).json({ message: "Delivery address is required" });
  }

  try {
    const orderRef = adminDb.collection("orders").doc();

    const result = await adminDb.runTransaction(async (tx) => {
      // ---- 1. READS — every tx.get must happen before any tx.set/update ----
      const productRefs = items.map((item) => adminDb.collection("products").doc(item.productId));
      const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

      let couponSnap = null;
      if (couponCode) {
        couponSnap = await tx.get(
          adminDb.collection("coupons").where("code", "==", couponCode.trim().toUpperCase()).limit(1)
        );
      }

      // ---- 2. VALIDATE + COMPUTE (no Firestore calls in this section) ----
      let subtotal = 0;
      const resolvedItems = [];

      productSnaps.forEach((snap, i) => {
        const item = items[i];
        if (!snap.exists) throw new Error(`Product ${item.productId} not found`);

        const product = snap.data();
        if (!product.isEnabled) throw new Error(`${product.name} is not available`);
        if (product.stock < item.qty) throw new Error(`${product.name} is out of stock`);

        const unitPrice = product.discountPrice ?? product.price;
        subtotal += unitPrice * item.qty;

        resolvedItems.push({
          productId: item.productId,
          name: product.name,
          qty: item.qty,
          price: unitPrice,
          variant: item.variant || null,
        });
      });

      let discount = 0;
      let couponRef = null;
      let couponUsageCount = 0;
      if (couponCode) {
        if (couponSnap.empty) throw new Error("Invalid promo code");
        const couponDoc = couponSnap.docs[0];
        couponRef = couponDoc.ref;
        couponUsageCount = couponDoc.data().usageCount || 0;
        discount = computeDiscount(couponDoc.data(), subtotal);
      }

      const deliveryFee = DELIVERY_METHODS[deliveryMethod].fee;
      const processingFee = PROCESSING_FEE;
      const total = subtotal - discount + processingFee + deliveryFee;
      const orderNumber = `IH-${Date.now().toString().slice(-8)}`;

      // ---- 3. WRITES ----
      productSnaps.forEach((snap, i) => {
        tx.update(productRefs[i], { stock: snap.data().stock - items[i].qty });
      });

      if (couponRef) {
        tx.update(couponRef, { usageCount: couponUsageCount + 1 });
      }

      tx.set(orderRef, {
        userId: decodedUser?.uid || null,
        orderNumber,
        items: resolvedItems,
        subtotal,
        discount,
        processingFee,
        deliveryFee,
        deliveryMethod,
        deliveryMethodLabel: DELIVERY_METHODS[deliveryMethod].label,
        acceptedTermsAt: new Date(),
        total,
        couponCode: couponCode || null,
        status: "pending",
        paymentStatus: "unpaid",
        paymentRef: null,
        paymentMethod,
        paymentProofUrl: null,
        bank: bankDetails(), // snapshot, so the order page keeps showing the account the customer was given
        contactEmail: contactEmail || decodedUser?.email || null,
        deliveryAddress,
        packaging: "discreet",
        createdAt: new Date(),
        statusHistory: [{ status: "pending", at: new Date(), note: "Order received. Transfer the total to the bank account shown on the order page, then send us the receipt so we can confirm your payment." }],
      });

      return { orderId: orderRef.id, orderNumber, subtotal, discount, processingFee, deliveryFee, total, paymentMethod, paymentStatus: "unpaid" };
    });

    // Tell the customer how to pay. A mail failure must not lose the order.
    try {
      const to = contactEmail || decodedUser.email;
      if (to) {
        const mail = orderReceivedEmail({
          name: deliveryAddress.recipientName,
          order: result,
          bank: bankDetails(),
          link: `${process.env.APP_URL}/order-confirmation/${result.orderId}`,
        });
        await sendMail({ to, ...mail });
      }
    } catch (mailErr) {
      console.error("Order-received email failed", mailErr);
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Order could not be created" });
  }
}
