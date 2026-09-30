import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Lock, Banknote } from "lucide-react";
import ProductCard from "../../components/storefront/ProductCard";
import { getFeaturedProducts } from "../../services/productService";
import { listCategories } from "../../services/categoryService";

export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getFeaturedProducts().then(setFeatured).catch(() => setFeatured([]));
    listCategories().then(setCategories).catch(console.error);
  }, []);

  const cats = categories.filter((c) => c.isEnabled !== false);

  return (
    <div>
      <section className="hero">
        <div className="hero-in">
          <h1>Intimate wellness, delivered discreetly.</h1>
          <p>Thoughtfully chosen products. Plain packaging. Private by default.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn">Shop now</Link>
            {cats.length > 0 && <a href="#categories" className="btn btn-outline">Browse categories</a>}
          </div>
        </div>
      </section>

      <div className="trust">
        <div><Package size={20} /><span><strong>Plain packaging</strong>Nothing on the parcel says what's inside.</span></div>
        <div><Lock size={20} /><span><strong>Private by default</strong>Your details stay with us.</span></div>
        <div><Banknote size={20} /><span><strong>Pay your way</strong>Pay securely online by card, bank transfer or USSD.</span></div>
      </div>

      {cats.length > 0 && (
        <section className="section" id="categories">
          <h2>Shop by category</h2>
          <div className="cat-grid">
            {cats.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.id}`} className="cat-tile">
                <div className="cat-img">{c.image ? <img src={c.image} alt="" loading="lazy" /> : c.name[0]}</div>
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="sec-head">
          <h2>Featured</h2>
          <Link to="/shop">View all</Link>
        </div>
        {featured === null ? (
          <div className="grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" />)}</div>
        ) : featured.length === 0 ? (
          <p className="muted">New products are on the way. <Link to="/shop">Browse the shop</Link>.</p>
        ) : (
          <div className="grid">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </section>
    </div>
  );
}
