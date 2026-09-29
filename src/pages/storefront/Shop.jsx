import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import ProductCard from "../../components/storefront/ProductCard";
import { getEnabledProducts } from "../../services/productService";
import { listCategories } from "../../services/categoryService";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  // category and search live in the URL so results can be shared and the back button works
  const category = params.get("category") || "";
  const search = params.get("q") || "";

  useEffect(() => {
    Promise.all([getEnabledProducts(), listCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c.filter((x) => x.isEnabled !== false)); })
      .finally(() => setLoading(false));
  }, []);

  function update(patch) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  }

  const visible = useMemo(() => {
    const eff = (p) => (p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price);
    const list = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (minPrice && eff(p) < Number(minPrice)) return false;
      if (maxPrice && eff(p) > Number(maxPrice)) return false;
      return true;
    });
    const t = (p) => p.createdAt?.seconds || 0;
    return [...list].sort((a, b) =>
      sort === "price-asc" ? eff(a) - eff(b)
      : sort === "price-desc" ? eff(b) - eff(a)
      : sort === "popular" ? (b.ratingCount || 0) - (a.ratingCount || 0)
      : t(b) - t(a));
  }, [products, category, search, minPrice, maxPrice, sort]);

  const hasFilters = category || search || minPrice || maxPrice;
  const activeCat = categories.find((c) => c.id === category);
  function clearAll() { setParams({}); setMinPrice(""); setMaxPrice(""); }

  return (
    <div className="section">
      <h1>{activeCat ? activeCat.name : "Shop"}</h1>

      <div className="chips" role="tablist" aria-label="Categories">
        <button className={`chip ${!category ? "on" : ""}`} onClick={() => update({ category: "" })}>All</button>
        {categories.map((c) => (
          <button key={c.id} className={`chip ${category === c.id ? "on" : ""}`} onClick={() => update({ category: c.id })}>{c.name}</button>
        ))}
      </div>

      <div className="filters">
        <input className="f-search" type="search" placeholder="Search products" value={search} onChange={(e) => update({ q: e.target.value })} />
        <input className="f-price" type="number" min="0" placeholder="Min ₦" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <input className="f-price" type="number" min="0" placeholder="Max ₦" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {!loading && (
        <div className="result-bar">
          <span>{visible.length} {visible.length === 1 ? "product" : "products"}</span>
          {hasFilters && <button className="link-btn" onClick={clearAll}>Clear filters</button>}
        </div>
      )}

      {loading ? (
        <div className="grid">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="skeleton" />)}</div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Search size={26} /></div>
          <h2>No products found</h2>
          <p className="muted">Try a different search or remove some filters.</p>
          {hasFilters && <button className="btn" onClick={clearAll}>Clear filters</button>}
        </div>
      ) : (
        <div className="grid">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}
