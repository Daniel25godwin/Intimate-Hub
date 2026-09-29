import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCustomers, setCustomerDisabled } from "../../services/customerService";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = () => listCustomers().then(setCustomers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => customers.filter((c) =>
    !q || `${c.displayName || ""} ${c.email || ""}`.toLowerCase().includes(q.toLowerCase())
  ), [customers, q]);

  async function toggleDisabled(c) {
    if (c.isDisabled === false && !confirm(`Disable ${c.email}? They won't be able to place orders while disabled.`)) return;
    await setCustomerDisabled(c.id, !c.isDisabled);
    load();
  }

  return (
    <div>
      <h1>Customers</h1>
      <input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />

      {loading ? <p>Loading…</p> : shown.length === 0 ? <p className="muted">No customers found.</p> : (
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.id}>
                <td>{c.displayName || "—"}</td>
                <td>{c.email}</td>
                <td>{c.phone || "—"}</td>
                <td>{c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : "—"}</td>
                <td><span className={`pill ${c.isDisabled ? "pill-cancelled" : "pill-green"}`}>{c.isDisabled ? "Disabled" : "Active"}</span></td>
                <td>
                  <Link to={`/admin/orders?customer=${c.id}`}>Orders</Link>{" "}
                  <button onClick={() => toggleDisabled(c)}>{c.isDisabled ? "Enable" : "Disable"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
