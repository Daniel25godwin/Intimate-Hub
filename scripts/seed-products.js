/**
 * One-time local script to seed sample categories + products for testing.
 * Uses placeholder images (picsum.photos) — replace with real product
 * photos in the admin panel before launch. Safe to run more than once;
 * it always adds new docs rather than checking for duplicates, so don't
 * run it repeatedly against a real/production database.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/seed-products.js
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const CATEGORIES = [
  { name: "Massage & Oils", slug: "massage-oils" },
  { name: "Wellness Devices", slug: "wellness-devices" },
  { name: "Accessories", slug: "accessories" },
];

async function main() {
  const catRefs = {};
  for (const [i, cat] of CATEGORIES.entries()) {
    const ref = await db.collection("categories").add({
      ...cat,
      image: `https://picsum.photos/seed/${cat.slug}/400/400`,
      order: i,
      isEnabled: true,
    });
    catRefs[cat.slug] = ref.id;
    console.log(`Category: ${cat.name} (${ref.id})`);
  }

  const PRODUCTS = [
    {
      name: "Silk Massage Oil — Rose",
      slug: "silk-massage-oil-rose",
      description: "A lightweight, body-safe massage oil with a soft rose scent. Non-staining, easy to wash.",
      price: 8500, discountPrice: 6900,
      category: catRefs["massage-oils"],
      sku: "IH-OIL-001", stock: 24,
      isFeatured: true, isBestseller: true, isNew: false, isEnabled: true,
      images: ["https://picsum.photos/seed/rose-oil/700/700", "https://picsum.photos/seed/rose-oil-2/700/700"],
      specifications: { "Volume": "100ml", "Material": "Body-safe, water-based" },
      variants: [{ name: "Scent", options: ["Rose", "Vanilla", "Unscented"] }],
    },
    {
      name: "Calm Wellness Wand",
      slug: "calm-wellness-wand",
      description: "Whisper-quiet, rechargeable, with multiple intensity settings. Discreet travel case included.",
      price: 24000, discountPrice: null,
      category: catRefs["wellness-devices"],
      sku: "IH-DEV-001", stock: 12,
      isFeatured: true, isBestseller: false, isNew: true, isEnabled: true,
      images: ["https://picsum.photos/seed/wand/700/700"],
      specifications: { "Material": "Medical-grade silicone", "Charging": "USB-C", "Waterproof": "Yes" },
      variants: [{ name: "Color", options: ["Blush", "Black"] }],
    },
    {
      name: "Comfort Set — Travel Pouch",
      slug: "comfort-set-travel-pouch",
      description: "A discreet zip pouch for keeping your essentials organised and private, at home or on the go.",
      price: 5000, discountPrice: null,
      category: catRefs["accessories"],
      sku: "IH-ACC-001", stock: 40,
      isFeatured: false, isBestseller: true, isNew: false, isEnabled: true,
      images: ["https://picsum.photos/seed/pouch/700/700"],
      specifications: { "Material": "Water-resistant fabric" },
      variants: [],
    },
    {
      name: "Silk Massage Candle — Vanilla",
      slug: "silk-massage-candle-vanilla",
      description: "Melts into a warm, skin-safe massage oil. Soy-based, low melting point.",
      price: 9500, discountPrice: 7800,
      category: catRefs["massage-oils"],
      sku: "IH-OIL-002", stock: 0,
      isFeatured: false, isBestseller: false, isNew: true, isEnabled: true,
      images: ["https://picsum.photos/seed/candle/700/700"],
      specifications: { "Burn time": "~20 hours", "Wax": "Soy blend" },
      variants: [],
    },
  ];

  for (const p of PRODUCTS) {
    const ref = await db.collection("products").add({
      ...p,
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`Product: ${p.name} (${ref.id})`);
  }

  console.log("\nDone. Check /shop and the admin Products/Categories pages.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
