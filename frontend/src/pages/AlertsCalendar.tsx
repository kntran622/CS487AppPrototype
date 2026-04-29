import { useEffect, useState } from "react";
import { api } from "../api";

const FREQUENCIES     = ["weekly","monthly","yearly"];
const BILL_CATEGORIES = ["Housing","School","Play","Food","Transportation","Other","Income"];
const SPEND_CATEGORIES = ["Food","Housing","School","Games","Play","Other"];


export default function AlertsCalendar() {
  const [alerts,      setAlerts]      = useState<any[]>([]);
  const [bills,       setBills]       = useState<any[]>([]);
  const [rules,       setRules]       = useState<any[]>([]);
  const [addingBill,  setAddingBill]  = useState(false);
  const [addingRule,  setAddingRule]  = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [billForm,    setBillForm]    = useState<any>({});
  const [ruleForm,    setRuleForm]    = useState<any>({ category:"Food", threshold:"", phone_notify:false });

  const loadAlerts = () => api.get<any[]>("/alerts").then(setAlerts);
  const loadBills  = () => api.get<any[]>("/bills").then(setBills);
  const loadRules  = () => api.get<any[]>("/alert-rules").then(setRules);

  useEffect(() => { loadAlerts(); loadBills(); loadRules(); }, []);

  const markRead   = async (id: number) => { await api.put(`/alerts/${id}/read`); loadAlerts(); };
  const markPaid   = async (id: number) => { await api.put(`/bills/${id}/paid`);  loadBills();  };
  const deleteBill = async (id: number) => { await api.del(`/bills/${id}`);        loadBills();  };
  const deleteRule = async (id: number) => { await api.del(`/alert-rules/${id}`);  loadRules();  };

  const openAddBill = () => {
    setBillForm({ name:"", amount:"", due_date:new Date().toISOString().slice(0,10), recurring:false, frequency:"monthly", category:"Housing" });
    setAddingBill(true);
  };
  const handleAddBill = async () => {
    await api.post("/bills", { ...billForm, amount: parseFloat(billForm.amount) });
    setAddingBill(false); loadBills();
  };

  const openAddRule = () => {
    setRuleForm({ category:"Food", threshold:"", phone_notify:false });
    setAddingRule(true);
  };
  const handleAddRule = async () => {
    if (!ruleForm.threshold) return;
    await api.post("/alert-rules", { ...ruleForm, threshold: parseFloat(ruleForm.threshold) });
    setAddingRule(false); loadRules();
  };

  const openEditRule = (r: any) => {
    setEditingRule(r);
    setRuleForm({ category:r.category, threshold:String(r.threshold), phone_notify:!!r.phone_notify });
  };
  const handleEditRule = async () => {
    await api.put(`/alert-rules/${editingRule.id}`, { threshold:parseFloat(ruleForm.threshold), phone_notify:ruleForm.phone_notify });
    setEditingRule(null); loadRules();
  };

  const unread = alerts.filter(a => !a.read);
  const read   = alerts.filter(a =>  a.read);
  const unpaid = bills.filter(b => !b.paid);
  const paid   = bills.filter(b =>  b.paid);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alerts & Calendar</h1>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-secondary" onClick={openAddRule}>+ Spending Alert</button>
          <button className="btn btn-primary"   onClick={openAddBill}>+ Add Bill</button>
        </div>
      </div>

      {/* Spending Alert Rules */}
      <div className="card" style={{ marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div className="card-title" style={{ margin:0 }}>Spending Alert Rules</div>
          <span style={{ fontSize:"0.78rem", color:"var(--text-light)" }}>
            Notified when a category exceeds a monthly threshold
          </span>
        </div>
        {rules.length === 0 ? (
          <div className="empty-state">No rules yet. Add one to get alerted when you overspend.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {rules.map(r => (
              <div key={r.id} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 14px", borderRadius:"var(--radius-sm)",
                background:"var(--green-pale)", border:"1px solid var(--green-light)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{
                    display:"inline-block", padding:"3px 10px", borderRadius:20,
                    fontSize:"0.75rem", fontWeight:600,
                    background:"var(--green-light)", color:"var(--green-dark)",
                  }}>{r.category}</span>
                  <span style={{ fontSize:"0.88rem" }}>
                    Alert when &gt; <b>${r.threshold.toFixed(0)}</b>/month
                  </span>
                  {r.phone_notify
                    ? <span style={{ fontSize:"0.75rem", color:"#6366f1", fontWeight:600 }}>Phone notify ON</span>
                    : <span style={{ fontSize:"0.75rem", color:"var(--text-light)" }}>In-app only</span>
                  }
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEditRule(r)}>Edit</button>
                  <button className="btn btn-sm btn-danger"    onClick={() => deleteRule(r.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Alerts */}
        <div>
          <div className="card-title" style={{ marginBottom:12 }}>Notifications</div>
          {unread.length === 0 && (
            <div style={{ color:"var(--text-light)", fontSize:"0.88rem", marginBottom:16 }}>No new alerts.</div>
          )}
          {unread.map(a => (
            <div key={a.id} className={`alert-item unread ${a.type === "anomaly" || a.type === "threshold" ? "anomaly" : ""}`}>
              <div className="alert-msg">
                <div>{a.message}</div>
                <div className="alert-time">{a.created_at}</div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => markRead(a.id)}>Dismiss</button>
            </div>
          ))}
          {read.length > 0 && (
            <>
              <div style={{ fontSize:"0.78rem", color:"var(--text-light)", margin:"16px 0 8px", fontWeight:600, textTransform:"uppercase" }}>Past</div>
              {read.map(a => (
                <div key={a.id} className="alert-item" style={{ opacity:0.6 }}>
                  <div className="alert-msg">
                    <div>{a.message}</div>
                    <div className="alert-time">{a.created_at}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Bills */}
        <div>
          <div className="card-title" style={{ marginBottom:12 }}>Upcoming Bills</div>
          {unpaid.length === 0 && (
            <div style={{ color:"var(--text-light)", fontSize:"0.88rem" }}>All bills paid!</div>
          )}
          {unpaid.map(b => (
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
                    <button className="btn btn-sm btn-danger"  onClick={() => deleteBill(b.id)}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {paid.length > 0 && (
            <>
              <div style={{ fontSize:"0.78rem", color:"var(--text-light)", margin:"16px 0 8px", fontWeight:600, textTransform:"uppercase" }}>Paid</div>
              {paid.map(b => (
                <div key={b.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--green-pale)", opacity:0.6, fontSize:"0.88rem" }}>
                  <span style={{ textDecoration:"line-through" }}>{b.name}</span>
                  <span>${b.amount.toFixed(2)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Add Bill Modal */}
      {addingBill && (
        <div className="modal-overlay" onClick={() => setAddingBill(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Bill / Event</h2>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={billForm.name} placeholder="e.g. Rent"
                onChange={e => setBillForm({...billForm, name:e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" min="0" step="0.01" value={billForm.amount}
                  onChange={e => setBillForm({...billForm, amount:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={billForm.due_date}
                  onChange={e => setBillForm({...billForm, due_date:e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={billForm.category} onChange={e => setBillForm({...billForm, category:e.target.value})}>
                  {BILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Recurring?</label>
                <select value={billForm.recurring ? "yes" : "no"}
                  onChange={e => setBillForm({...billForm, recurring:e.target.value === "yes"})}>
                  <option value="no">One-time</option>
                  <option value="yes">Recurring</option>
                </select>
              </div>
            </div>
            {billForm.recurring && (
              <div className="form-group">
                <label>Frequency</label>
                <select value={billForm.frequency} onChange={e => setBillForm({...billForm, frequency:e.target.value})}>
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAddingBill(false)}>Cancel</button>
              <button className="btn btn-primary"   onClick={handleAddBill}>Add Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {addingRule && (
        <div className="modal-overlay" onClick={() => setAddingRule(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Spending Alert Rule</h2>
            <p style={{ fontSize:"0.85rem", color:"var(--text-light)", marginBottom:16 }}>
              You'll get an alert when spending in a category exceeds this amount in a calendar month.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={ruleForm.category} onChange={e => setRuleForm({...ruleForm, category:e.target.value})}>
                  {SPEND_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Monthly Limit ($)</label>
                <input type="number" min="1" step="1" value={ruleForm.threshold} placeholder="e.g. 200"
                  onChange={e => setRuleForm({...ruleForm, threshold:e.target.value.replace(/[^0-9.]/g,"")})} />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                <input type="checkbox" checked={ruleForm.phone_notify}
                  onChange={e => setRuleForm({...ruleForm, phone_notify:e.target.checked})}
                  style={{ width:16, height:16 }} />
                <span>
                  <b>Enable phone notification</b>
                  <span style={{ display:"block", fontSize:"0.78rem", color:"var(--text-light)", marginTop:2 }}>
                    In a real app this would push to your device. Here it's shown as a tag on the rule.
                  </span>
                </span>
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAddingRule(false)}>Cancel</button>
              <button className="btn btn-primary"   onClick={handleAddRule}>Create Rule</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="modal-overlay" onClick={() => setEditingRule(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Rule — {editingRule.category}</h2>
            <div className="form-group">
              <label>Monthly Limit ($)</label>
              <input type="number" min="1" step="1" value={ruleForm.threshold}
                onChange={e => setRuleForm({...ruleForm, threshold:e.target.value.replace(/[^0-9.]/g,"")})} />
            </div>
            <div className="form-group">
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                <input type="checkbox" checked={ruleForm.phone_notify}
                  onChange={e => setRuleForm({...ruleForm, phone_notify:e.target.checked})}
                  style={{ width:16, height:16 }} />
                <span><b>Phone notification</b></span>
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditingRule(null)}>Cancel</button>
              <button className="btn btn-primary"   onClick={handleEditRule}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}