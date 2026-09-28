import { useEffect, useState } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../services/categoryService";
import { uploadImage } from "../../services/imageService";
import { slugify } from "../../utils/format";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => listCategories().then(setItems);
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const image = file ? await uploadImage(file, "categories") : "";
      await createCategory({ name, slug: slugify(name), image, order: items.length, isEnabled: true });
      setName(""); setFile(null); e.target.reset();
      await load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  async function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[i], b = items[j];
    await Promise.all([updateCategory(a.id, { order: j }), updateCategory(b.id, { order: i })]);
    load();
  }

  async function remove(c) {
    if (!confirm(`Delete "${c.name}"? Products in it keep pointing at a missing category.`)) return;
    await deleteCategory(c.id);
    load();
  }

  return (
    <div>
      <h1>Categories</h1>
      <form onSubmit={add} className="row">
        <input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button disabled={busy}>{busy ? "Saving…" : "Add category"}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead><tr><th></th><th>Name</th><th>Visible</th><th>Order</th><th></th></tr></thead>
        <tbody>
          {items.map((c, i) => (
            <tr key={c.id}>
              <td>{c.image && <img src={c.image} alt="" width="40" height="40" style={{ objectFit: "cover" }} />}</td>
              <td>{c.name}</td>
              <td><input type="checkbox" checked={c.isEnabled !== false} onChange={(e) => updateCategory(c.id, { isEnabled: e.target.checked }).then(load)} /></td>
              <td><button onClick={() => move(i, -1)}>↑</button> <button onClick={() => move(i, 1)}>↓</button></td>
              <td><button onClick={() => remove(c)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
