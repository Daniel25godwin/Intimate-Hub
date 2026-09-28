import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../../components/storefront/ProductCard";
import { getEnabledProducts } from "../../services/productService";
import { listCategories } from "../../services/categoryService";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const category = params.get("category") || "";

  useEffect(() => {
    Promise.all([getEnabledProducts(), listCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .finally(() => setLoading(false));
  }, []);

  // Catalog is filtered client-side: fine for a few hundred products and avoids
  // Firestore composite indexes. Revisit if the catalog grows a lot.
  const visible = useMemo(() => {
    const eff = (p) => (p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price);
    let list = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (minPrice && eff(p) < Number(minPrice)) return false;
      if (maxPrice && eff(p) > Number(maxPrice)) return false;
      return true;
    });
    const t = (p) => p.createdAt?.seconds || 0;
    list = [...list].sort((a, b) =>
      sort === "price-asc" ? eff(a) - eff(b)
      : sort === "price-desc" ? eff(b) - eff(a)
      : sort === "popular" ? (b.ratingCount || 0) - (a.ratingCount || 0)
      : t(b) - t(a));
    return list;
  }, [products, category, search, minPrice, maxPrice, sort]);

  return (
    <div className="section">
      <h1>Shop</h1>
      <div className="filters">
        <input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setParams(e.target.value ? { category: e.target.value } : {})}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="number" placeholder="Min ₦" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <input type="number" placeholder="Max ₦" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
      {loading ? <p>Loading…</p> : visible.length === 0 ? <p className="muted">No products found.</p> : (
        <div className="grid">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}
