import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getWishlistIds, toggleWishlist } from "../../../services/wishlistService";
import { getProductById } from "../../../services/productService";
import { optimizedUrl } from "../../../services/imageService";
import { formatCurrency } from "../../../utils/format";

export default function Wishlist() {
  const { user } = useAuth();
  const [products, setProducts] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const ids = await getWishlistIds(user.uid);
        // a product that was disabled/deleted simply drops out of the list
        const found = await Promise.all(ids.map((id) => getProductById(id).catch(() => null)));
        setProducts(found.filter((p) => p && p.isEnabled !== false));
      } catch { setProducts([]); }
    })();
  }, [user]);

  async function remove(p) {
    setProducts((list) => list.filter((x) => x.id !== p.id));
    try { await toggleWishlist(user.uid, p.id, false); } catch { /* list refreshes next visit */ }
  }

  if (products === null) return <div className="grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>;

  if (products.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon"><Heart size={26} /></div>
        <h2>Nothing saved yet</h2>
        <p className="muted">Tap the heart on any product to keep it here for later.</p>
        <Link to="/shop" className="btn">Browse the shop</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Wishlist</h2>
      <div className="grid">
        {products.map((p) => (
          <div key={p.id}>
            <Link to={`/product/${p.slug}`}>
              {p.images?.[0] && <img src={optimizedUrl(p.images[0], 500)} alt={p.name} loading="lazy" />}
            </Link>
            <div className="wish-body">
              <Link to={`/product/${p.slug}`}><strong>{p.name}</strong></Link>
              <div>{formatCurrency(p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price)}</div>
              <button className="link-btn" onClick={() => remove(p)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
