import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../../components/storefront/ProductCard";
import { getFeaturedProducts } from "../../services/productService";
import { listCategories } from "../../services/categoryService";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getFeaturedProducts().then(setFeatured).catch(console.error);
    listCategories().then(setCategories).catch(console.error);
  }, []);

  return (
    <div>
      <section className="hero">
        <h1>Intimate wellness, delivered discreetly.</h1>
        <p>Thoughtfully chosen products. Plain packaging. Private by default.</p>
        <Link to="/shop" className="btn">Shop now</Link>
      </section>

      {categories.length > 0 && (
        <section className="section">
          <h2>Shop by category</h2>
          <div className="chips">
            {categories.filter((c) => c.isEnabled !== false).map((c) => (
              <Link key={c.id} to={`/shop?category=${c.id}`} className="chip">{c.name}</Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="section">
          <h2>Featured</h2>
          <div className="grid">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
