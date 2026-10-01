import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, ShieldCheck, MessageCircle } from "lucide-react";
import HeroSlider from "../../components/storefront/HeroSlider";
import ProductBrowser from "../../components/storefront/ProductBrowser";
import { listCategories } from "../../services/categoryService";
import { optimizedUrl } from "../../services/imageService";
import { BRAND } from "../../config/brand";

export default function Home() {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    listCategories().then((c) => setCategories(c.filter((x) => x.isEnabled !== false))).catch(() => setCategories([]));
  }, []);

  return (
    <div>
      <HeroSlider />

      <div className="cat-row" id="categories" aria-label="Shop by category">
        {categories === null
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="cat-item"><div className="cat-circle skeleton" /></div>)
          : categories.map((c) => (
            <Link key={c.id} to={`/shop?category=${c.id}`} className="cat-item">
              <div className="cat-circle">{c.image ? <img src={optimizedUrl(c.image, 300)} alt="" loading="lazy" /> : c.name[0]}</div>
              <span>{c.name}</span>
            </Link>
          ))}
      </div>

      <div className="trust">
        <div><Truck size={20} /><span><strong>{BRAND.freeDelivery}</strong>Straight to your door.</span></div>
        <div><ShieldCheck size={20} /><span><strong>Secure payment</strong>Pay by card, bank transfer or USSD.</span></div>
        {BRAND.whatsapp && <div><MessageCircle size={20} /><span><strong>Need help?</strong>Chat with us on WhatsApp.</span></div>}
      </div>

      <ProductBrowser embedded />
    </div>
  );
}
