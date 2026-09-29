import { useEffect, useState } from "react";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../services/couponService";

const EMPTY = { code: "", type: "percent", value: "", minOrderValue: "", expiresAt: "", usageLimit: "", isActive: true };

export default function Coupons() {
  const [items, setItems] = useState([]);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => listCoupons().then(setItems);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await createCoupon({
        code: f.code.trim().toUpperCase(),
        type: f.type,
        value: Number(f.value),
        minOrderValue: f.minOrderValue ? Number(f.minOrderValue) : 0,
        expiresAt: f.expiresAt ? new Date(f.expiresAt) : null,
        usageLimit: f.usageLimit ? Number(f.usageLimit) : 0,
        isActive: f.isActive,
      });
      setF(EMPTY);
      await load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <div>
      <h1>Coupons</h1>
      <form onSubmit={save} className="row">
        <input placeholder="CODE" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} required />
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="percent">Percent off</option>
          <option value="fixed">Fixed amount off (₦)</option>
        </select>
        <input type="number" placeholder={f.type === "percent" ? "e.g. 10 (%)" : "e.g. 2000 (₦)"} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} required />
        <input type="number" placeholder="Min order value (₦, optional)" value={f.minOrderValue} onChange={(e) => setF({ ...f, minOrderValue: e.target.value })} />
        <input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} />
        <input type="number" placeholder="Usage limit (optional)" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} />
        <button disabled={busy}>{busy ? "Saving…" : "Add coupon"}</button>
      </form>
      {error && <p className="error">{error}</p>}

      <table className="table">
        <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Expires</th><th>Used</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.code}</strong></td>
              <td>{c.type === "percent" ? `${c.value}%` : `₦${c.value}`}</td>
              <td>{c.minOrderValue ? `₦${c.minOrderValue}` : "—"}</td>
              <td>{c.expiresAt ? new Date(c.expiresAt.seconds ? c.expiresAt.seconds * 1000 : c.expiresAt).toLocaleDateString() : "—"}</td>
              <td>{c.usageCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
              <td><input type="checkbox" checked={c.isActive} onChange={(e) => updateCoupon(c.id, { isActive: e.target.checked }).then(load)} /></td>
              <td><button onClick={() => deleteCoupon(c.id).then(load)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
