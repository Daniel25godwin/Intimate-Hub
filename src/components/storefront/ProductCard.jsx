import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/format";
import { optimizedUrl } from "../../services/imageService";

export default function ProductCard({ product }) {
  const onSale = product.discountPrice && product.discountPrice < product.price;
  const price = onSale ? product.discountPrice : product.price;
  return (
    <Link to={`/product/${product.slug}`} className="card">
      <div className="card-img">
        {product.images?.[0] ? <img src={optimizedUrl(product.images[0], 500)} alt={product.name} loading="lazy" /> : null}
        {onSale && <span className="badge">Sale</span>}
        {product.stock <= 0 && <span className="badge dark">Sold out</span>}
      </div>
      <div className="card-body">
        <h3>{product.name}</h3>
        <p>
          <strong>{formatCurrency(price)}</strong>
          {onSale && <s className="muted"> {formatCurrency(product.price)}</s>}
        </p>
      </div>
    </Link>
  );
}
