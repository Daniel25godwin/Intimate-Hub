import slide1 from "../assets/banners/slide-1.jpg";
import slide2 from "../assets/banners/slide-2.jpg";
import slide3 from "../assets/banners/slide-3.jpg";

// One place to change your store's name, banners and contact details.
export const BRAND = {
  name: "Perfect Touch",
  tagline: "Online store",          // small line under the name in the header ("" to hide)
  logo: "",                          // optional: e.g. "/logo.png" (put the file in /public). Replaces the text name.
  whatsapp: "2348138275031",        // e.g. "2348012345678" (country code, no +). Shows a WhatsApp button when set.
  freeDelivery: "Free delivery on every order",
  designer: { name: "Kerrry Web", whatsapp: "2348138275031", text: "Hi Kerrry Web, I saw your work on Perfect Touch and I'd like to talk about a website." },
  supportEmail: "",                  // shown in the Terms and Privacy pages, e.g. "support@yourstore.com"

  // Home page banners. Add an `image` URL to use a photo instead of the colour.
  hero: [
    { title: "Everything you need", accent: ", in one place", text: "Quality products, great prices, delivered to your door.", cta: "Shop now", to: "/shop",
      bg: "#0b0d12", image: slide1 },
    { title: "Shop by", accent: " category", text: "Find exactly what you need, fast.", cta: "Browse all", to: "#categories",
      bg: "#0b0d12", image: slide2, layout: "top" },   // layout "top" = text across the top (this photo has products across the full width)
    { title: "Free delivery", accent: " on every order", text: "Order today and we bring it to your door.", cta: "Start shopping", to: "/shop",
      bg: "#0b0d12", image: slide3 },
  ],
};
