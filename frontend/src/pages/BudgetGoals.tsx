import { useEffect, useState } from "react";
import { api } from "../api";

const CATEGORIES = ["Savings","Tech","Travel","Transportation","Other"];

function badgeClass(cat: string) {
  return "badge badge-" + cat.toLowerCase();
}

export default function BudgetGoals() {
  const [goals,   setGoals]   = useState<any[]>([]);
  const [adding,  setAdding]  = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form,    setForm]    = useState<any>({});

  const load = () => api.get<any[]>("/goals").then(setGoals);
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ name:"", target_amount:"", current_amount:"0", deadline:"", category:"Savings" });
    setAdding(true);
  };

  const handleAdd = async () => {
    await api.post("/goals", {
      ...form,
      target_amount:  parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount),
    });
    setAdding(false); load();
  };

  const handleContribute = async (goal: any) => {
    const input = prompt(`Add to "${goal.name}" (current: $${goal.current_amount})`);
    if (!input) return;
    const amount = parseFloat(input);
    if (isNaN(amount)) return;
    await api.put(`/goals/${goal.id}`, { current_amount: Math.min(goal.current_amount + amount, goal.target_amount) });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this goal?")) return;
    await api.del(`/goals/${id}`);
    load();
  };

  const totalSaved  = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount,  0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Budget & Goals</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ New Goal</button>
      </div>

      <div className="stat-row">
        <div className="stat-chip">
          <div className="label">Total Saved</div>
          <div className="value green">${totalSaved.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Total Target</div>
          <div className="value">${totalTarget.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Overall Progress</div>
          <div className="value green">
            {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {goals.length === 0 && <div className="empty-state card">No goals yet. Add one to get started!</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {goals.map((g) => {
          const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
          const remaining = g.target_amount - g.current_amount;
          return (
            <div className="card" key={g.id}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:"1rem", marginBottom:4 }}>{g.name}</div>
                  <span className={badgeClass(g.category)}>{g.category}</span>
                  {g.deadline && (
                    <span style={{ marginLeft:8, fontSize:"0.78rem", color:"var(--text-light)" }}>
                      Due {g.deadline}
                    </span>
                  )}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:700, fontSize:"1.1rem", color:"var(--green-dark)" }}>
                    ${g.current_amount.toFixed(2)}
                    <span style={{ fontWeight:400, color:"var(--text-light)", fontSize:"0.85rem" }}> / ${g.target_amount.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize:"0.78rem", color:"var(--text-light)" }}>
                    ${remaining.toFixed(2)} remaining
                  </div>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${pct}%`, background: pct >= 100 ? "var(--green-dark)" : "var(--green-mid)" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                <span style={{ fontSize:"0.82rem", color:"var(--text-light)" }}>{pct.toFixed(1)}% complete</span>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleContribute(g)}>+ Contribute</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(g.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Goal</h2>
            <div className="form-group">
              <label>Goal Name</label>
              <input type="text" value={form.name} placeholder="e.g. Emergency Fund"
                onChange={(e) => setForm({...form, name:e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target Amount ($)</label>
                <input type="number" min="1" step="0.01" value={form.target_amount}
                  onChange={(e) => setForm({...form, target_amount:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Already Saved ($)</label>
                <input type="number" min="0" step="0.01" value={form.current_amount}
                  onChange={(e) => setForm({...form, current_amount:e.target.value})} />
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
                <label>Deadline (optional)</label>
                <input type="date" value={form.deadline}
                  onChange={(e) => setForm({...form, deadline:e.target.value})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Create Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}