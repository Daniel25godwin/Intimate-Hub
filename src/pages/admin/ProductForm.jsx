import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, updateProduct, getProductById } from "../../services/productService";
import { listCategories } from "../../services/categoryService";
import { uploadImage } from "../../services/imageService";
import { slugify } from "../../utils/format";

const EMPTY = {
  name: "", description: "", price: "", discountPrice: "", category: "", sku: "", stock: 0,
  isFeatured: false, isBestseller: false, isNew: true, isEnabled: true,
  images: [], specs: [{ key: "", value: "" }], variants: [{ name: "", options: "" }],
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listCategories().then(setCategories);
    if (id) {
      getProductById(id).then((p) => p && setF({
        ...EMPTY, ...p,
        price: p.price ?? "", discountPrice: p.discountPrice ?? "",
        specs: Object.entries(p.specifications || {}).map(([key, value]) => ({ key, value })).concat([{ key: "", value: "" }]),
        variants: (p.variants || []).map((v) => ({ name: v.name, options: v.options.join(", ") })).concat([{ name: "", options: "" }]),
      }));
    }
  }, [id]);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function addImages(e) {
    setBusy(true); setError("");
    try {
      const urls = [];
      for (const file of e.target.files) urls.push(await uploadImage(file, "products"));
      set("images", [...f.images, ...urls]);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const data = {
      name: f.name.trim(),
      slug: slugify(f.name),
      description: f.description,
      price: Number(f.price),
      discountPrice: f.discountPrice === "" ? null : Number(f.discountPrice),
      category: f.category,
      sku: f.sku,
      stock: Number(f.stock),
      isFeatured: f.isFeatured, isBestseller: f.isBestseller, isNew: f.isNew, isEnabled: f.isEnabled,
      images: f.images,
      specifications: Object.fromEntries(f.specs.filter((s) => s.key).map((s) => [s.key, s.value])),
      variants: f.variants.filter((v) => v.name && v.options.trim())
        .map((v) => ({ name: v.name, options: v.options.split(",").map((o) => o.trim()).filter(Boolean) })),
    };
    try {
      if (id) await updateProduct(id, data); else await createProduct(data);
      navigate("/admin/products");
    } catch (err) { setError(err.message); setBusy(false); }
  }

  const listEdit = (key, i, patch) => set(key, f[key].map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  return (
    <form onSubmit={save} className="form" style={{ maxWidth: 720 }}>
      <h1>{id ? "Edit product" : "Add product"}</h1>
      <input placeholder="Name" value={f.name} onChange={(e) => set("name", e.target.value)} required />
      <textarea placeholder="Description" rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} />
      <div className="row">
        <input type="number" placeholder="Price (₦)" value={f.price} onChange={(e) => set("price", e.target.value)} required />
        <input type="number" placeholder="Discount price (optional)" value={f.discountPrice} onChange={(e) => set("discountPrice", e.target.value)} />
      </div>
      <div className="row">
        <select value={f.category} onChange={(e) => set("category", e.target.value)} required>
          <option value="">Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input placeholder="SKU" value={f.sku} onChange={(e) => set("sku", e.target.value)} />
        <input type="number" min="0" placeholder="Stock" value={f.stock} onChange={(e) => set("stock", e.target.value)} />
      </div>

      <div className="row">
        {[["isEnabled", "Active"], ["isFeatured", "Featured"], ["isBestseller", "Bestseller"], ["isNew", "New"]].map(([k, label]) => (
          <label key={k}><input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} /> {label}</label>
        ))}
      </div>

      <h3>Images</h3>
      <input type="file" accept="image/*" multiple onChange={addImages} disabled={busy} />
      <div className="thumbs">
        {f.images.map((img, i) => (
          <div key={img} style={{ position: "relative" }}>
            <img src={img} alt="" />
            <button type="button" onClick={() => set("images", f.images.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 0, right: 0 }}>×</button>
          </div>
        ))}
      </div>

      <h3>Specifications</h3>
      {f.specs.map((s, i) => (
        <div className="row" key={i}>
          <input placeholder="e.g. Material" value={s.key} onChange={(e) => listEdit("specs", i, { key: e.target.value })} />
          <input placeholder="e.g. Body-safe silicone" value={s.value} onChange={(e) => listEdit("specs", i, { value: e.target.value })} />
        </div>
      ))}
      <button type="button" onClick={() => set("specs", [...f.specs, { key: "", value: "" }])}>+ spec</button>

      <h3>Variants</h3>
      {f.variants.map((v, i) => (
        <div className="row" key={i}>
          <input placeholder="Name (e.g. Color)" value={v.name} onChange={(e) => listEdit("variants", i, { name: e.target.value })} />
          <input placeholder="Options, comma separated" value={v.options} onChange={(e) => listEdit("variants", i, { options: e.target.value })} />
        </div>
      ))}
      <button type="button" onClick={() => set("variants", [...f.variants, { name: "", options: "" }])}>+ variant</button>

      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? "Working…" : "Save product"}</button>
    </form>
  );
}
