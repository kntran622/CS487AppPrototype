import { useEffect, useState } from "react";
import { api } from "../api";

const CATEGORIES = ["Savings","Tech","Travel","Transportation","Other"];

function badgeClass(cat: string) {
  return "badge badge-" + cat.toLowerCase();
}

type ModalMode = "add" | "edit" | "contribute" | null;

export default function BudgetGoals() {
  const [goals,         setGoals]        = useState<any[]>([]);
  const [modalMode,     setModalMode]    = useState<ModalMode>(null);
  const [activeGoal,    setActiveGoal]   = useState<any>(null);
  const [form,          setForm]         = useState<any>({});
  const [contributeAmt, setContributeAmt] = useState("");
  const [contributeErr, setContributeErr] = useState("");

  const load = () => api.get<any[]>("/goals").then(setGoals);
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ name:"", target_amount:"", current_amount:"0", deadline:"", category:"Savings" });
    setModalMode("add");
  };

  const handleAdd = async () => {
    if (!form.name || !form.target_amount) return;
    await api.post("/goals", {
      ...form,
      target_amount:  parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
    });
    setModalMode(null); load();
  };

  const openEdit = (g: any) => {
    setActiveGoal(g);
    setForm({
      name:           g.name,
      target_amount:  String(g.target_amount),
      current_amount: String(g.current_amount),
      deadline:       g.deadline ?? "",
      category:       g.category ?? "Savings",
    });
    setModalMode("edit");
  };

  const handleEdit = async () => {
    await api.put(`/goals/${activeGoal.id}/edit`, {
      name:           form.name,
      target_amount:  parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount),
      deadline:       form.deadline,
      category:       form.category,
    });
    setModalMode(null); load();
  };

  const openContribute = (g: any) => {
    setActiveGoal(g);
    setContributeAmt("");
    setContributeErr("");
    setModalMode("contribute");
  };

  const handleContribute = async () => {
    const amt = parseFloat(contributeAmt);
    if (isNaN(amt) || amt <= 0) {
      setContributeErr("Please enter a valid amount greater than 0.");
      return;
    }
    const newVal = Math.min(activeGoal.current_amount + amt, activeGoal.target_amount);
    await api.put(`/goals/${activeGoal.id}`, { current_amount: newVal });
    setModalMode(null); load();
  };

  const handleDelete = async (id: number) => {
    await api.del(`/goals/${id}`);
    load();
  };

  const closeModal = () => setModalMode(null);

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

      {goals.length === 0 && (
        <div className="empty-state card">No goals yet. Add one to get started!</div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {goals.map((g) => {
          const pct       = Math.min((g.current_amount / g.target_amount) * 100, 100);
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
                    <span style={{ fontWeight:400, color:"var(--text-light)", fontSize:"0.85rem" }}>
                      {" "}/ ${g.target_amount.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize:"0.78rem", color:"var(--text-light)" }}>
                    ${remaining.toFixed(2)} remaining
                  </div>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width:`${pct}%`,
                  background: pct >= 100 ? "var(--green-dark)" : "var(--green-mid)"
                }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                <span style={{ fontSize:"0.82rem", color:"var(--text-light)" }}>{pct.toFixed(1)}% complete</span>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openContribute(g)}>+ Contribute</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(g)}>Edit</button>
                  <button className="btn btn-sm btn-danger"    onClick={() => handleDelete(g.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      {modalMode === "add" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Goal</h2>
            <div className="form-group">
              <label>Goal Name</label>
              <input type="text" value={form.name} placeholder="e.g. Emergency Fund"
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target Amount ($)</label>
                <input type="number" min="1" step="0.01" value={form.target_amount}
                  onChange={e => setForm({...form, target_amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Already Saved ($)</label>
                <input type="number" min="0" step="0.01" value={form.current_amount}
                  onChange={e => setForm({...form, current_amount: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Deadline (optional)</label>
                <input type="date" value={form.deadline}
                  onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary"   onClick={handleAdd}>Create Goal</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {modalMode === "edit" && activeGoal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Goal</h2>
            <div className="form-group">
              <label>Goal Name</label>
              <input type="text" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target Amount ($)</label>
                <input type="number" min="1" step="0.01" value={form.target_amount}
                  onChange={e => setForm({...form, target_amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Current Saved ($)</label>
                <input type="number" min="0" step="0.01" value={form.current_amount}
                  onChange={e => setForm({...form, current_amount: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Deadline (optional)</label>
                <input type="date" value={form.deadline}
                  onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary"   onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute modal */}
      {modalMode === "contribute" && activeGoal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Contribute to "{activeGoal.name}"</h2>
            <div style={{ marginBottom:16, padding:"12px 14px", background:"var(--green-pale)", borderRadius:"var(--radius-sm)", fontSize:"0.88rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"var(--text-light)" }}>Current saved</span>
                <span style={{ fontWeight:600 }}>${activeGoal.current_amount.toFixed(2)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ color:"var(--text-light)" }}>Remaining</span>
                <span style={{ fontWeight:600, color:"var(--green-dark)" }}>
                  ${(activeGoal.target_amount - activeGoal.current_amount).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="form-group">
              <label>Amount to add ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={contributeAmt}
                placeholder="0.00"
                autoFocus
                onChange={e => {
                  setContributeErr("");
                  setContributeAmt(e.target.value.replace(/[^0-9.]/g, ""));
                }}
              />
              {contributeErr && (
                <div style={{ color:"var(--danger)", fontSize:"0.8rem", marginTop:5 }}>
                  {contributeErr}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary"   onClick={handleContribute}>Add Funds</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}