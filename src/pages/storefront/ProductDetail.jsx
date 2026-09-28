import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductBySlug } from "../../services/productService";
import { formatCurrency } from "../../utils/format";
import { optimizedUrl } from "../../services/imageService";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(undefined);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    getProductBySlug(slug).then(setProduct).catch(() => setProduct(null));
  }, [slug]);

  if (product === undefined) return <p className="section">Loading…</p>;
  if (product === null) return <p className="section">Product not found.</p>;

  const onSale = product.discountPrice && product.discountPrice < product.price;
  const price = onSale ? product.discountPrice : product.price;
  const stockLabel = product.stock <= 0 ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock";

  return (
    <div className="section detail">
      <div>
        {product.images?.[active] && <img className="detail-main" src={optimizedUrl(product.images[active], 900)} alt={product.name} />}
        <div className="thumbs">
          {product.images?.map((img, i) => (
            <img key={img} src={optimizedUrl(img, 120)} alt="" onClick={() => setActive(i)} className={i === active ? "on" : ""} />
          ))}
        </div>
      </div>
      <div>
        <h1>{product.name}</h1>
        <p className="price">
          <strong>{formatCurrency(price)}</strong>
          {onSale && <s className="muted"> {formatCurrency(product.price)}</s>}
        </p>
        <p className={product.stock > 0 ? "" : "error"}>{stockLabel}</p>

        {product.variants?.map((v) => (
          <div key={v.name} className="variant">
            <label>{v.name}</label>
            <select value={selected[v.name] || ""} onChange={(e) => setSelected({ ...selected, [v.name]: e.target.value })}>
              <option value="">Select</option>
              {v.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}

        <button className="btn" disabled title="Cart arrives in the next phase">Add to cart</button>

        <h3>Description</h3>
        <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <>
            <h3>Specifications</h3>
            <table className="specs"><tbody>
              {Object.entries(product.specifications).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody></table>
          </>
        )}
      </div>
    </div>
  );
}
