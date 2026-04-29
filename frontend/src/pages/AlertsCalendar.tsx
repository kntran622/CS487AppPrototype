import { useEffect, useState } from "react";
import { api } from "../api";

const FREQUENCIES = ["weekly","monthly","yearly"];
const CATEGORIES  = ["Housing","School","Play","Food","Transportation","Other","Income"];

const ALERT_ICONS: Record<string,string> = {
  bill: "📅", anomaly: "⚠️", goal: "🎯", balance: "💰", info: "ℹ️",
};

export default function AlertsCalendar() {
  const [alerts,  setAlerts]  = useState<any[]>([]);
  const [bills,   setBills]   = useState<any[]>([]);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState<any>({});

  const loadAlerts = () => api.get<any[]>("/alerts").then(setAlerts);
  const loadBills  = () => api.get<any[]>("/bills").then(setBills);

  useEffect(() => { loadAlerts(); loadBills(); }, []);

  const markRead = async (id: number) => {
    await api.put(`/alerts/${id}/read`);
    loadAlerts();
  };

  const markPaid = async (id: number) => {
    await api.put(`/bills/${id}/paid`);
    loadBills();
  };

  const deleteBill = async (id: number) => {
    if (!confirm("Delete this bill?")) return;
    await api.del(`/bills/${id}`);
    loadBills();
  };

  const openAdd = () => {
    setForm({ name:"", amount:"", due_date: new Date().toISOString().slice(0,10), recurring:false, frequency:"monthly", category:"Housing" });
    setAdding(true);
  };

  const handleAdd = async () => {
    await api.post("/bills", { ...form, amount: parseFloat(form.amount) });
    setAdding(false); loadBills();
  };

  const unread = alerts.filter((a) => !a.read);
  const read   = alerts.filter((a) => a.read);
  const unpaid = bills.filter((b) => !b.paid);
  const paid   = bills.filter((b) =>  b.paid);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alerts & Calendar</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Bill</button>
      </div>

      <div className="grid-2">
        {/* Alerts column */}
        <div>
          <div className="card-title" style={{ marginBottom:12 }}>🔔 Notifications</div>
          {unread.length === 0 && <div style={{ color:"var(--text-light)", fontSize:"0.88rem", marginBottom:16 }}>No new alerts.</div>}
          {unread.map((a) => (
            <div key={a.id} className={`alert-item unread ${a.type === "anomaly" ? "anomaly" : ""}`}>
              <span className="alert-icon">{ALERT_ICONS[a.type] ?? "ℹ️"}</span>
              <div className="alert-msg">
                <div>{a.message}</div>
                <div className="alert-time">{a.created_at}</div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => markRead(a.id)}>Dismiss</button>
            </div>
          ))}
          {read.length > 0 && (
            <>
              <div style={{ fontSize:"0.78rem", color:"var(--text-light)", margin:"16px 0 8px", fontWeight:600, textTransform:"uppercase" }}>
                Past Notifications
              </div>
              {read.map((a) => (
                <div key={a.id} className="alert-item" style={{ opacity:0.6 }}>
                  <span className="alert-icon">{ALERT_ICONS[a.type] ?? "ℹ️"}</span>
                  <div className="alert-msg">
                    <div>{a.message}</div>
                    <div className="alert-time">{a.created_at}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Bills column */}
        <div>
          <div className="card-title" style={{ marginBottom:12 }}>📆 Upcoming Bills</div>
          {unpaid.length === 0 && <div style={{ color:"var(--text-light)", fontSize:"0.88rem" }}>All bills paid!</div>}
          {unpaid.map((b) => (
            <div key={b.id} className="card" style={{ marginBottom:12, padding:"14px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:600 }}>{b.name}</div>
                  <div style={{ fontSize:"0.78rem", color:"var(--text-light)" }}>
                    Due {b.due_date} {b.recurring ? `· ${b.frequency}` : ""}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className={b.category === "Income" ? "amount-positive" : "amount-negative"} style={{ fontWeight:700 }}>
                    {b.category === "Income" ? "+" : "-"}${b.amount.toFixed(2)}
                  </div>
                  <div style={{ display:"flex", gap:6, marginTop:6, justifyContent:"flex-end" }}>
                    <button className="btn btn-sm btn-primary" onClick={() => markPaid(b.id)}>Mark Paid</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteBill(b.id)}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {paid.length > 0 && (
            <>
              <div style={{ fontSize:"0.78rem", color:"var(--text-light)", margin:"16px 0 8px", fontWeight:600, textTransform:"uppercase" }}>
                Paid
              </div>
              {paid.map((b) => (
                <div key={b.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--green-pale)", opacity:0.6, fontSize:"0.88rem" }}>
                  <span style={{ textDecoration:"line-through" }}>{b.name}</span>
                  <span>${b.amount.toFixed(2)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Bill / Event</h2>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={form.name} placeholder="e.g. Rent"
                onChange={(e) => setForm({...form, name:e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={(e) => setForm({...form, amount:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.due_date}
                  onChange={(e) => setForm({...form, due_date:e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Recurring?</label>
                <select value={form.recurring ? "yes" : "no"}
                  onChange={(e) => setForm({...form, recurring: e.target.value === "yes"})}>
                  <option value="no">One-time</option>
                  <option value="yes">Recurring</option>
                </select>
              </div>
            </div>
            {form.recurring && (
              <div className="form-group">
                <label>Frequency</label>
                <select value={form.frequency} onChange={(e) => setForm({...form, frequency:e.target.value})}>
                  {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Add Bill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}