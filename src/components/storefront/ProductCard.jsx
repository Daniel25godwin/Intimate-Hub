import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, ShoppingCart, Check, X, Star } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { optimizedUrl } from "../../services/imageService";
import { formatCurrency } from "../../utils/format";

function QuickView({ product: p, price, onSale, out, hasVariants, href, onAdd, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="qv-scrim" onClick={onClose}>
      <div className="qv" role="dialog" aria-modal="true" aria-label={p.name} onClick={(e) => e.stopPropagation()}>
        <button className="qv-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        {p.images?.[0] && <img src={optimizedUrl(p.images[0], 700)} alt={p.name} />}
        <div className="qv-body">
          <h3>{p.name}</h3>
          <div className="pc-price">{formatCurrency(price)}{onSale && <s>{formatCurrency(p.price)}</s>}</div>
          {p.description && <p className="muted">{p.description.length > 150 ? `${p.description.slice(0, 150)}…` : p.description}</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: "auto" }}>
            {out ? <button className="btn" disabled>Sold out</button>
              : <button className="btn" onClick={() => { onAdd(); }}>{hasVariants ? "Choose options" : "Add to cart"}</button>}
            <Link className="btn btn-outline" to={href} onClick={onClose}>Full details</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product: p }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [quick, setQuick] = useState(false);

  const onSale = p.discountPrice && p.discountPrice < p.price;
  const price = onSale ? p.discountPrice : p.price;
  const percent = onSale ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;
  const out = p.stock <= 0;
  const hasVariants = p.variants?.length > 0;
  const href = `/product/${p.slug}`;

  useEffect(() => {
    if (!added) return undefined;
    const t = setTimeout(() => setAdded(false), 3000);
    return () => clearTimeout(t);
  }, [added]);

  function add() {
    if (hasVariants) { setQuick(false); navigate(href); return; }
    addItem(p, 1, null);
    setAdded(true);
    setQuick(false);
  }

  const rating = Number(p.rating ?? p.ratingAverage ?? p.avgRating) || 0;

  return (
    <article className="pc">
      <div className="pc-media">
        <Link to={href} aria-label={p.name}>
          {p.images?.[0] && <img src={optimizedUrl(p.images[0], 500)} alt="" loading="lazy" />}
        </Link>
        <div className="pc-badges">
          {out ? <span className="pc-badge out">Sold out</span> : <>
            {onSale && <span className="pc-badge sale">-{percent}%</span>}
            {p.isNew && <span className="pc-badge">New</span>}
          </>}
        </div>
        <button className="pc-eye" onClick={() => setQuick(true)} aria-label={`Quick view ${p.name}`}><Eye size={18} /></button>
      </div>

      <div className="pc-body">
        <Link to={href} className="pc-name">{p.name}</Link>
        {rating > 0 && p.ratingCount > 0 && (
          <div className="pc-rate"><Star size={13} fill="currentColor" /> {rating.toFixed(1)} <span>({p.ratingCount})</span></div>
        )}
        <div className="pc-foot">
          <div className="pc-price">{formatCurrency(price)}{onSale && <s>{formatCurrency(p.price)}</s>}</div>
          <button
            className={`pc-add ${added ? "added" : ""}`}
            disabled={out}
            onClick={added ? () => navigate("/cart") : add}
            aria-label={out ? "Sold out" : added ? "Added. View cart" : hasVariants ? `Select options for ${p.name}` : `Add ${p.name} to cart`}
          >
            {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          </button>
        </div>
      </div>

      {quick && <QuickView product={p} price={price} onSale={onSale} out={out} hasVariants={hasVariants} href={href} onAdd={add} onClose={() => setQuick(false)} />}
    </article>
  );
}
