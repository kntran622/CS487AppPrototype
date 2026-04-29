import { useEffect, useState } from "react";
import { api } from "../api";

const CATEGORIES = ["Food","Housing","School","Games","Play","Income","Other"];

function badgeClass(cat: string) {
  return "badge badge-" + cat.toLowerCase().replace(/\s+/g,"-");
}

export default function Transactions() {
  const [txns,     setTxns]     = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filter,   setFilter]   = useState("all");
  const [editing,  setEditing]  = useState<any>(null);
  const [adding,   setAdding]   = useState(false);
  const [form,     setForm]     = useState<any>({});

  const load = () => api.get<any[]>("/transactions").then(setTxns);

  useEffect(() => {
    load();
    api.get<any[]>("/accounts").then(setAccounts);
  }, []);

  const filtered = filter === "all" ? txns : txns.filter((t) => t.category === filter);

  const openAdd = () => {
    setForm({ account_id: accounts[0]?.id ?? 1, type:"expense", category:"Food", date: new Date().toISOString().slice(0,10), amount:"", merchant:"", note:"" });
    setAdding(true);
  };

  const handleAdd = async () => {
    await api.post("/transactions", { ...form, amount: parseFloat(form.amount) });
    setAdding(false); load();
  };

  const handleEdit = async () => {
    await api.put(`/transactions/${editing.id}`, { category: editing.category, merchant: editing.merchant, note: editing.note });
    setEditing(null); load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    await api.del(`/transactions/${id}`);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Transaction</button>
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["all", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`btn btn-sm ${filter === c ? "btn-primary" : "btn-secondary"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Merchant</th><th>Category</th>
                <th>Account</th><th>Amount</th><th>Note</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state">No transactions found.</div></td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td style={{ fontWeight:500 }}>{t.merchant || "—"}</td>
                  <td><span className={badgeClass(t.category)}>{t.category}</span></td>
                  <td>{t.account_name}</td>
                  <td className={t.type === "income" ? "amount-positive" : "amount-negative"}>
                    {t.type === "income" ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                  </td>
                  <td style={{ color:"var(--text-light)", fontSize:"0.82rem" }}>{t.note || "—"}</td>
                  <td>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditing({...t})}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add modal */}
      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Transaction</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({...form, type:e.target.value})}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={(e) => setForm({...form, amount:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date}
                  onChange={(e) => setForm({...form, date:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Merchant / Source</label>
              <input type="text" value={form.merchant}
                onChange={(e) => setForm({...form, merchant:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Account</label>
              <select value={form.account_id} onChange={(e) => setForm({...form, account_id:parseInt(e.target.value)})}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.nickname}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Note (optional)</label>
              <input type="text" value={form.note}
                onChange={(e) => setForm({...form, note:e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Transaction</h2>
            <div className="form-group">
              <label>Category</label>
              <select value={editing.category} onChange={(e) => setEditing({...editing, category:e.target.value})}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Merchant</label>
              <input type="text" value={editing.merchant}
                onChange={(e) => setEditing({...editing, merchant:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Note</label>
              <input type="text" value={editing.note ?? ""}
                onChange={(e) => setEditing({...editing, note:e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}