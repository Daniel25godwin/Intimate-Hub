import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllProducts, updateProduct, deleteProduct } from "../../services/productService";
import { formatCurrency } from "../../utils/format";

export default function Products() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const load = () => getAllProducts().then(setItems);
  useEffect(() => { load(); }, []);

  const shown = items.filter((p) => (p.name + (p.sku || "")).toLowerCase().includes(q.toLowerCase()));

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await deleteProduct(p.id);
    load();
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn">Add product</Link>
      </div>
      <input placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className="table">
        <thead><tr><th></th><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.id}>
              <td>{p.images?.[0] && <img src={p.images[0]} alt="" width="40" height="40" style={{ objectFit: "cover" }} />}</td>
              <td>{p.name}</td>
              <td>{p.sku}</td>
              <td>{formatCurrency(p.discountPrice || p.price)}</td>
              <td style={{ color: p.stock <= 5 ? "#b00020" : undefined }}>{p.stock}</td>
              <td><input type="checkbox" checked={!!p.isEnabled} onChange={(e) => updateProduct(p.id, { isEnabled: e.target.checked }).then(load)} /></td>
              <td><Link to={`/admin/products/${p.id}/edit`}>Edit</Link> · <a href="#" onClick={(e) => { e.preventDefault(); remove(p); }}>Delete</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
