import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api";
import { CATEGORY_COLORS } from "./Dashboard";

const DEFAULT_COLOR = "#9ca3af";

const INITIAL_ALLOWANCES = [
  { id: 1, name: "Weekly Spending", amount: 50,  frequency: "weekly",  active: true  },
  { id: 2, name: "Savings Deposit", amount: 25,  frequency: "weekly",  active: true  },
  { id: 3, name: "Monthly Bonus",   amount: 100, frequency: "monthly", active: false },
];

export default function ParentAccount() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary,      setSummary]      = useState<any[]>([]);
  const [alerts,       setAlerts]       = useState<any[]>([]);
  const [allowances,   setAllowances]   = useState(INITIAL_ALLOWANCES);
  const [addingAllow,  setAddingAllow]  = useState(false);
  const [newAllow,     setNewAllow]     = useState({ name:"", amount:"", frequency:"weekly" });

  useEffect(() => {
    api.get<any[]>("/transactions").then(t => setTransactions(t.slice(0, 8)));
    api.get<any[]>("/spending-summary").then(setSummary);
    api.get<any[]>("/alerts").then(a => setAlerts(a.filter((x: any) => !x.read)));
  }, []);

  const totalSpend = summary.reduce((s, r) => s + r.total, 0);

  const toggleAllowance = (id: number) =>
    setAllowances(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));

  const addAllowance = () => {
    if (!newAllow.name || !newAllow.amount) return;
    setAllowances(prev => [...prev, {
      id: Date.now(), name: newAllow.name,
      amount: parseFloat(newAllow.amount),
      frequency: newAllow.frequency, active: true,
    }]);
    setNewAllow({ name:"", amount:"", frequency:"weekly" });
    setAddingAllow(false);
  };

  const removeAllowance = (id: number) =>
    setAllowances(prev => prev.filter(a => a.id !== id));

  const monthlyAllowanceTotal = allowances
    .filter(a => a.active)
    .reduce((s, a) => s + (a.frequency === "weekly" ? a.amount * 4 : a.amount), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Parent Overview</h1>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:"0.9rem" }}>
            PD
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:"0.9rem" }}>Pat Doe</div>
            <div style={{ fontSize:"0.75rem", color:"var(--text-light)" }}>Parent of Jane Doe</div>
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-chip">
          <div className="label">Jane's Total Spend</div>
          <div className="value red">${totalSpend.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Active Allowances</div>
          <div className="value green">{allowances.filter(a => a.active).length}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Monthly Allowance</div>
          <div className="value green">${monthlyAllowanceTotal.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Unread Alerts</div>
          <div className="value red">{alerts.length}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Jane's Spending Breakdown</div>
          {summary.length === 0 ? (
            <div className="empty-state">No data yet.</div>
          ) : (
            <div className="donut-wrap">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={summary} dataKey="total" nameKey="category"
                    cx="50%" cy="50%" innerRadius={48} outerRadius={72}>
                    {summary.map((row) => (
                      <Cell key={row.category} fill={CATEGORY_COLORS[row.category] ?? DEFAULT_COLOR} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => (v != null ? `$${Number(v).toFixed(2)}` : "")} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-legend">
                {summary.map((row) => (
                  <div className="legend-item" key={row.category}>
                    <div className="legend-dot" style={{ background: CATEGORY_COLORS[row.category] ?? DEFAULT_COLOR }} />
                    <span>{row.category}</span>
                    <span style={{ color:"var(--text-light)", marginLeft:"auto", paddingLeft:12 }}>
                      {totalSpend > 0 ? ((row.total / totalSpend) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Active Alerts</div>
          {alerts.length === 0 ? (
            <div className="empty-state">No active alerts for Jane.</div>
          ) : alerts.map((a) => (
            <div key={a.id} style={{
              padding:"10px 14px", marginBottom:8, borderRadius:"var(--radius-sm)",
              background: a.type === "anomaly" ? "#fff0f0" : "#fff9e6",
              borderLeft: `4px solid ${a.type === "anomaly" ? "var(--danger)" : "var(--warning)"}`,
              fontSize:"0.87rem",
            }}>
              <div style={{ fontWeight:500 }}>{a.message}</div>
              <div style={{ fontSize:"0.75rem", color:"var(--text-light)", marginTop:3 }}>{a.created_at}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card section-gap">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div className="card-title" style={{ margin:0 }}>Allowance Settings</div>
          <button className="btn btn-primary btn-sm" onClick={() => setAddingAllow(true)}>+ Add Allowance</button>
        </div>

        {allowances.length === 0 && <div className="empty-state">No allowances set up yet.</div>}

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {allowances.map((a) => (
            <div key={a.id} style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"12px 16px", borderRadius:"var(--radius-sm)",
              background: a.active ? "var(--green-pale)" : "#f5f5f5",
              border: `1px solid ${a.active ? "var(--green-light)" : "#e0e0e0"}`,
              opacity: a.active ? 1 : 0.6,
            }}>
              <div>
                <div style={{ fontWeight:600, fontSize:"0.92rem" }}>{a.name}</div>
                <div style={{ fontSize:"0.78rem", color:"var(--text-light)", marginTop:2 }}>
                  ${a.amount.toFixed(2)} / {a.frequency}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{
                  fontSize:"0.75rem", fontWeight:600, padding:"3px 10px", borderRadius:20,
                  background: a.active ? "#d1f7e5" : "#f0f0f0",
                  color: a.active ? "#0a5c36" : "#888",
                }}>
                  {a.active ? "Active" : "Paused"}
                </span>
                <button className="btn btn-sm btn-secondary" onClick={() => toggleAllowance(a.id)}>
                  {a.active ? "Pause" : "Resume"}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => removeAllowance(a.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Jane's Recent Transactions</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td style={{ fontWeight:500 }}>{t.merchant || "—"}</td>
                  <td>
                    <span style={{
                      display:"inline-block", padding:"3px 10px", borderRadius:20,
                      fontSize:"0.75rem", fontWeight:600,
                      background: (CATEGORY_COLORS[t.category] ?? DEFAULT_COLOR) + "25",
                      color: CATEGORY_COLORS[t.category] ?? DEFAULT_COLOR,
                    }}>
                      {t.category}
                    </span>
                  </td>
                  <td className={t.type === "income" ? "amount-positive" : "amount-negative"}>
                    {t.type === "income" ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addingAllow && (
        <div className="modal-overlay" onClick={() => setAddingAllow(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Allowance</h2>
            <div className="form-group">
              <label>Label</label>
              <input type="text" value={newAllow.name} placeholder="e.g. Weekly Spending"
                onChange={e => setNewAllow({...newAllow, name: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" min="0" step="0.01" value={newAllow.amount}
                  onChange={e => setNewAllow({...newAllow, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select value={newAllow.frequency} onChange={e => setNewAllow({...newAllow, frequency: e.target.value})}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAddingAllow(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addAllowance}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}