import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Truck, Banknote, Heart } from "lucide-react";
import { getProductBySlug } from "../../services/productService";
import { formatCurrency } from "../../utils/format";
import { optimizedUrl } from "../../services/imageService";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getWishlistIds, toggleWishlist } from "../../services/wishlistService";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(undefined);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState(null); // { text, type: "warn" | "added" }
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProduct(undefined); setActive(0); setSelected({}); setQty(1); setNotice(null);
    getProductBySlug(slug).then(setProduct).catch(() => setProduct(null));
  }, [slug]);

  useEffect(() => {
    if (user && product?.id) getWishlistIds(user.uid).then((ids) => setSaved(ids.includes(product.id))).catch(() => {});
  }, [user, product?.id]);

  if (product === undefined) return <div className="section"><div className="skeleton" style={{ minHeight: 420 }} /></div>;
  if (product === null) {
    return (
      <div className="section empty">
        <h2>Product not found</h2>
        <p className="muted">It may have been removed or the link is out of date.</p>
        <Link to="/shop" className="btn">Back to shop</Link>
      </div>
    );
  }

  const onSale = product.discountPrice && product.discountPrice < product.price;
  const price = onSale ? product.discountPrice : product.price;
  const percentOff = onSale ? Math.round((1 - product.discountPrice / product.price) * 100) : 0;
  const out = product.stock <= 0;
  const stockClass = out ? "out" : product.stock <= 5 ? "low" : "";
  const stockLabel = out ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock";
  const maxQty = product.stock > 0 ? product.stock : 1;

  const missingVariant = (product.variants || []).find((v) => !selected[v.name]);
  const variantString = Object.values(selected).filter(Boolean).join(" / ") || null;

  async function toggleSave() {
    if (!user) { navigate("/login", { state: { from: { pathname: `/product/${slug}` } } }); return; }
    const next = !saved;
    setSaved(next);
    try { await toggleWishlist(user.uid, product.id, next); } catch { setSaved(!next); }
  }

  function handleAdd(goToCart) {
    if (missingVariant) {
      setNotice({ type: "warn", text: `Please choose a ${missingVariant.name.toLowerCase()} first.` });
      return;
    }
    addItem(product, qty, variantString);
    if (goToCart) navigate("/cart");
    else setNotice({ type: "added", text: `${qty} × ${product.name} added to your cart.` });
  }

  return (
    <div className="section">
      <div className="crumbs"><Link to="/shop">Shop</Link> / {product.name}</div>
      <div className="detail">
        <div>
          {product.images?.[active] && <img className="detail-main" src={optimizedUrl(product.images[active], 900)} alt={product.name} />}
          {product.images?.length > 1 && (
            <div className="thumbs">
              {product.images.map((img, i) => (
                <img key={img} src={optimizedUrl(img, 120)} alt={`View ${i + 1}`} onClick={() => setActive(i)} className={i === active ? "on" : ""} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1>{product.name}</h1>
          <p className="price">
            <strong>{formatCurrency(price)}</strong>
            {onSale && <><s className="muted">{formatCurrency(product.price)}</s><span className="off">−{percentOff}%</span></>}
          </p>
          <p className={`stock ${stockClass}`}>{stockLabel}</p>

          {product.variants?.map((v) => (
            <div key={v.name}>
              <div className="opt-label">{v.name}{selected[v.name] && <span>: {selected[v.name]}</span>}</div>
              <div className="opt-group" role="radiogroup" aria-label={v.name}>
                {v.options.map((o) => (
                  <button
                    key={o} type="button" role="radio" aria-checked={selected[v.name] === o}
                    className={`opt ${selected[v.name] === o ? "on" : ""}`}
                    onClick={() => { setSelected({ ...selected, [v.name]: o }); setNotice(null); }}
                  >{o}</button>
                ))}
              </div>
            </div>
          ))}

          <div className="buy-row">
            <div className="qty-stepper">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={out || qty <= 1} aria-label="Decrease quantity"><Minus size={16} /></button>
              <span aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={out || qty >= maxQty} aria-label="Increase quantity"><Plus size={16} /></button>
            </div>
            <button className="btn btn-full" onClick={() => handleAdd(false)} disabled={out}>Add to cart</button>
            <button className="btn btn-outline btn-full" onClick={() => handleAdd(true)} disabled={out}>Buy now</button>
            <button type="button" className="icon-btn" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={toggleSave}>
              <Heart size={20} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>

          {notice && (
            <div className={`notice ${notice.type === "warn" ? "warn" : ""}`} role="status">
              {notice.text}
              {notice.type === "added" && <Link to="/cart">View cart</Link>}
            </div>
          )}

          <ul className="assure">
            <li><Truck size={18} /> Free delivery on every order</li>
            <li><Banknote size={18} /> Secure online payment — card, bank transfer or USSD</li>
          </ul>

          {product.description && (<><h3>Description</h3><p style={{ whiteSpace: "pre-line" }}>{product.description}</p></>)}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <>
              <h3>Specifications</h3>
              <table className="specs"><tbody>
                {Object.entries(product.specifications).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
              </tbody></table>
            </>
          )}
        </div>
      </div>

      {/* Mobile: keep the buy button in reach while scrolling */}
      <div className="buybar">
        <strong>{formatCurrency(price)}</strong>
        <button className="btn" onClick={() => handleAdd(false)} disabled={out}>{out ? "Out of stock" : "Add to cart"}</button>
      </div>
    </div>
  );
}
