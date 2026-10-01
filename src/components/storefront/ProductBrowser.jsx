import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Search, Tag, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { getEnabledProducts } from "../../services/productService";
import { listCategories } from "../../services/categoryService";
import { formatCurrency } from "../../utils/format";

const PAGE = 16;
const eff = (p) => (p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price);

// Product list with filters, sorting and "show more". Used on the Home page and the Shop page.
export default function ProductBrowser({ embedded = false }) {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(embedded ? 8 : PAGE);

  const category = params.get("category") || "";
  const search = params.get("q") || "";
  const sort = params.get("sort") || (embedded ? "popular" : "latest");
  const onlySale = params.get("sale") === "1";
  const min = params.get("min") || "";
  const max = params.get("max") || "";
  const [minIn, setMinIn] = useState(min);
  const [maxIn, setMaxIn] = useState(max);
  useEffect(() => { setMinIn(min); setMaxIn(max); }, [min, max]);

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

  // the bottom bar's "Filters" tab links here with ?filters=1
  useEffect(() => {
    if (params.get("filters") === "1") { setOpen(true); update({ filters: "" }); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const list = useMemo(() => {
    const t = (p) => p.createdAt?.seconds || 0;
    const q = search.toLowerCase();
    const out = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (onlySale && !(p.discountPrice && p.discountPrice < p.price)) return false;
      if (min && eff(p) < Number(min)) return false;
      if (max && eff(p) > Number(max)) return false;
      return true;
    });
    return out.sort((a, b) =>
      sort === "price-asc" ? eff(a) - eff(b)
      : sort === "price-desc" ? eff(b) - eff(a)
      : sort === "popular" ? (b.ratingCount || 0) - (a.ratingCount || 0)
      : sort === "featured" ? (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || t(b) - t(a)
      : t(b) - t(a));
  }, [products, category, search, onlySale, min, max, sort]);

  useEffect(() => { setShown(embedded ? 8 : PAGE); }, [category, search, sort, onlySale, min, max, embedded]);

  const counts = useMemo(() => {
    const c = {};
    products.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
    return c;
  }, [products]);
  const range = useMemo(() => {
    if (!products.length) return null;
    const prices = products.map(eff);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

  const activeCat = categories.find((c) => c.id === category);
  const hasFilters = !!(category || search || onlySale || min || max);
  const clearAll = () => { setParams({}); setMinIn(""); setMaxIn(""); };
  const Heading = embedded ? "h2" : "h1";
  const visible = list.slice(0, shown);
  const plural = (n) => `${n} product${n === 1 ? "" : "s"}`;

  const chips = [];
  if (activeCat) chips.push({ label: activeCat.name, clear: () => update({ category: "" }) });
  if (search) chips.push({ label: `“${search}”`, clear: () => update({ q: "" }) });
  if (min || max) chips.push({ label: `${min ? formatCurrency(Number(min)) : "₦0"} – ${max ? formatCurrency(Number(max)) : "any"}`, clear: () => update({ min: "", max: "" }) });
  if (onlySale) chips.push({ label: "On sale", clear: () => update({ sale: "" }) });

  return (
    <section className="pb" id="products">
      {embedded ? (
        <div className="pb-head">
          <Heading className="pb-title">Best Sellers</Heading>
          <Link to="/shop" className="pb-all">View All <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <>
          <Heading className="pb-title">{activeCat ? activeCat.name : "Shop all products"}</Heading>
          <p className="pb-count" aria-live="polite">
            {loading ? "Loading products…" : list.length === 0 ? "No products found" : `Showing 1–${Math.min(shown, list.length)} of ${list.length} products`}
          </p>

          <div className="pb-cats" role="tablist" aria-label="Categories">
            <button className={`pb-pill ${!category ? "on" : ""}`} onClick={() => update({ category: "" })}>All</button>
            {categories.map((c) => (
              <button key={c.id} className={`pb-pill ${category === c.id ? "on" : ""}`} onClick={() => update({ category: c.id })}>{c.name}</button>
            ))}
          </div>

          <div className="pb-bar">
            <button className="pb-filter-btn" onClick={() => setOpen(true)}><SlidersHorizontal size={18} /> Filters{hasFilters ? ` (${chips.length})` : ""}</button>
            <select className="pb-sort" value={sort} onChange={(e) => update({ sort: e.target.value === "latest" ? "" : e.target.value })} aria-label="Sort products">
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>

          {chips.length > 0 && (
            <div className="pb-active">
              {chips.map((c) => <button key={c.label} className="pb-chip" onClick={c.clear}>{c.label} <X size={14} /></button>)}
              <button className="link-btn" onClick={clearAll}>Clear all</button>
            </div>
          )}
        </>
      )}

      <div className={`pb-layout ${embedded ? "embedded" : ""}`}>
        {!embedded && (
          <>
            <aside className={`fp ${open ? "open" : ""}`} aria-label="Filters">
          <div className="fp-head">
            <span><SlidersHorizontal size={20} /> Filters</span>
            <button className="fp-x" onClick={() => setOpen(false)} aria-label="Close filters"><X size={24} /></button>
          </div>
          <div className="fp-body">
            <h4>Categories</h4>
            <button className={`fp-cat ${!category ? "on" : ""}`} onClick={() => update({ category: "" })}><span>All products</span></button>
            {categories.map((c) => (
              <button key={c.id} className={`fp-cat ${category === c.id ? "on" : ""}`} onClick={() => update({ category: c.id })}>
                <span>{c.name}</span><span>{counts[c.id] || 0}</span>
              </button>
            ))}

            <h4>Filter by price</h4>
            {range && <p className="fp-range">Range: {range.min.toLocaleString()} – {range.max.toLocaleString()}</p>}
            <div className="fp-price">
              <input type="number" inputMode="numeric" min="0" placeholder="Min" value={minIn} onChange={(e) => setMinIn(e.target.value)} aria-label="Minimum price" />
              <span>–</span>
              <input type="number" inputMode="numeric" min="0" placeholder="Max" value={maxIn} onChange={(e) => setMaxIn(e.target.value)} aria-label="Maximum price" />
            </div>
            <button className="fp-apply" onClick={() => update({ min: minIn, max: maxIn })}>Apply price</button>

            <h4>Offers</h4>
            <label className="fp-offer"><Tag size={20} /> On sale only
              <input type="checkbox" checked={onlySale} onChange={(e) => update({ sale: e.target.checked ? "1" : "" })} />
            </label>
          </div>
          <div className="fp-foot">
            <button className="btn" style={{ width: "100%" }} onClick={() => setOpen(false)}>Show {plural(list.length)}</button>
          </div>
        </aside>
        {open && <div className="fp-scrim" onClick={() => setOpen(false)} />}
          </>
        )}

        <div>
          {loading ? (
            <div className="grid">{Array.from({ length: embedded ? 4 : 8 }).map((_, i) => <div key={i} className="skeleton" />)}</div>
          ) : list.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><Search size={26} /></div>
              <h2>No products found</h2>
              <p className="muted">Try a different search or remove some filters.</p>
              {hasFilters && <button className="btn" onClick={clearAll}>Clear filters</button>}
            </div>
          ) : (
            <>
              <div className="grid">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div>
              {!embedded && shown < list.length && (
                <div className="pb-more">
                  <button className="btn btn-outline" onClick={() => setShown((s) => s + PAGE)}>Show more products ({list.length - shown} left)</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
