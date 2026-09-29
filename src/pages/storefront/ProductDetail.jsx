import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductBySlug } from "../../services/productService";
import { formatCurrency } from "../../utils/format";
import { optimizedUrl } from "../../services/imageService";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(undefined);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState("");
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    getProductBySlug(slug).then(setProduct).catch(() => setProduct(null));
  }, [slug]);

  if (product === undefined) return <p className="section">Loading…</p>;
  if (product === null) return <p className="section">Product not found.</p>;

  const onSale = product.discountPrice && product.discountPrice < product.price;
  const price = onSale ? product.discountPrice : product.price;
  const stockLabel = product.stock <= 0 ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock";

  const missingVariant = (product.variants || []).find((v) => !selected[v.name]);
  const variantString = Object.values(selected).filter(Boolean).join(" / ") || null;

  function handleAdd(goToCheckout) {
    if (missingVariant) {
      setNotice(`Please select ${missingVariant.name}`);
      return;
    }
    addItem(product, qty, variantString);
    if (goToCheckout) navigate("/cart");
    else setNotice("Added to cart");
  }

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

        {notice && <p className="muted">{notice}</p>}
        <div className="row">
          <input type="number" min="1" max={product.stock || 99} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} style={{ width: 70 }} disabled={product.stock <= 0} />
          <button className="btn" onClick={() => handleAdd(false)} disabled={product.stock <= 0}>Add to cart</button>
          <button className="btn btn-outline" onClick={() => handleAdd(true)} disabled={product.stock <= 0}>Buy now</button>
        </div>

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
