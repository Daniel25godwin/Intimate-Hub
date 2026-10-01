import { useEffect } from "react";
import { X } from "lucide-react";
import { BRAND } from "../../config/brand";

// DRAFT COPY — placeholder text so the sign-up flow works end to end.
// Have a lawyer review/replace before launch, and set `supportEmail` in src/config/brand.js.
const contact = BRAND.supportEmail
  ? `Questions? Email ${BRAND.supportEmail}.`
  : "Questions? Contact us using the details on our website.";

const DOCS = {
  terms: {
    title: "Terms of Service",
    body: [
      ["Eligibility", "You must be at least 18 years old to create an account or place an order. By registering you confirm that you are."],
      ["Orders & payment", "Prices are shown in Nigerian Naira. Payment is made securely online through our payment provider. An order is confirmed once payment is received. We may cancel an order if an item is unavailable, and will refund any payment made."],
      ["Delivery", `${BRAND.freeDelivery}. Delivery times are estimates and depend on your location.`],
      ["Returns & refunds", "If an item arrives faulty, damaged or different from what you ordered, tell us promptly after delivery and we will arrange a replacement or refund. Any other returns follow the policy shown on the product page or at checkout."],
      ["Your account", "Keep your login details private. You are responsible for activity on your account."],
      ["Acceptable use", "Do not misuse the site, attempt to access other people's accounts, or post unlawful or abusive reviews."],
      ["Contact", contact],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      ["What we collect", "Your email, name, phone number, delivery address and order history, so we can process and deliver your orders."],
      ["How we use it", "To fulfil orders, provide support, prevent fraud and, only if you opt in, send offers. We never sell your data."],
      ["Who processes it", "We use trusted providers to run the store — for example Google Firebase (accounts and database), Cloudinary (product images) and Paystack (payments). Card and bank details are handled by Paystack and never stored by us."],
      ["Your rights", "You can view or correct your details in your account, and ask us to delete your account and data, in line with applicable data protection law including the Nigeria Data Protection Act."],
      ["Contact", contact],
    ],
  },
};

export default function LegalModal({ docKey, onClose }) {
  useEffect(() => {
    if (!docKey) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [docKey, onClose]);

  const doc = docKey && DOCS[docKey];
  if (!doc) return null;

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label={doc.title} onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-head">
          <h2>{doc.title}</h2>
          <button type="button" className="auth-eye" style={{ position: "static", transform: "none" }} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="auth-modal-body">
          {doc.body.map(([h, p]) => (
            <section key={h}><h3>{h}</h3><p>{p}</p></section>
          ))}
        </div>
      </div>
    </div>
  );
}
