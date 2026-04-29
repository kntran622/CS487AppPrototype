import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { api } from "../api";

export const CATEGORY_COLORS: Record<string, string> = {
  Food:     "#3a9a5c",
  Housing:  "#3b82f6",
  School:   "#f59e0b",
  Games:    "#8b5cf6",
  Play:     "#f97316",
  Income:   "#10b981",
  Other:    "#9ca3af",
};
const DEFAULT_COLOR = "#9ca3af";

function monthStr(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function Dashboard() {
  const [accounts,    setAccounts]    = useState<any[]>([]);
  const [thisMonth,   setThisMonth]   = useState<any[]>([]);
  const [lastMonth,   setLastMonth]   = useState<any[]>([]);
  const [bills,       setBills]       = useState<any[]>([]);
  const [health,      setHealth]      = useState<any>(null);
  const [showCompare, setShowCompare] = useState(false);

  const currentMonthStr = monthStr(0);
  const lastMonthStr    = monthStr(-1);

  useEffect(() => {
    api.get<any[]>("/accounts").then(setAccounts);
    api.get<any[]>(`/spending-summary?month=${currentMonthStr}`).then(setThisMonth);
    api.get<any[]>(`/spending-summary?month=${lastMonthStr}`).then(setLastMonth);
    api.get<any[]>("/bills").then((b) => setBills(b.filter((x: any) => !x.paid).slice(0, 5)));
    api.get<any>("/health-score").then(setHealth);
  }, []);

  const totalBalance    = accounts.reduce((s, a) => s + a.balance, 0);
  const totalThisSpend  = thisMonth.reduce((s, r) => s + r.total, 0);
  const totalLastSpend  = lastMonth.reduce((s, r) => s + r.total, 0);
  const spendDiff       = totalThisSpend - totalLastSpend;

  const allCategories = Array.from(new Set([...thisMonth.map(r => r.category), ...lastMonth.map(r => r.category)]));
  const compareData = allCategories.map(cat => ({
    category: cat,
    [monthLabel(currentMonthStr)]: thisMonth.find(r => r.category === cat)?.total ?? 0,
    [monthLabel(lastMonthStr)]:    lastMonth.find(r => r.category === cat)?.total ?? 0,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ color:"var(--text-light)", fontSize:"0.85rem" }}>
          {new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </span>
      </div>

      <div className="stat-row">
        <div className="stat-chip">
          <div className="label">Total Balance</div>
          <div className="value green">${totalBalance.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">This Month's Spend</div>
          <div className="value red">${totalThisSpend.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">vs Last Month</div>
          <div className={`value ${spendDiff <= 0 ? "green" : "red"}`}>
            {spendDiff >= 0 ? "+" : ""}${spendDiff.toFixed(2)}
          </div>
        </div>
        {health && (
          <div className="stat-chip">
            <div className="label">Health Score</div>
            <div className="value green">{health.score}/100</div>
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div className="card-title" style={{ margin:0 }}>Spending Summary</div>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowCompare(v => !v)}>
              {showCompare ? "Show Donut" : "Compare Months"}
            </button>
          </div>

          {showCompare ? (
            compareData.length === 0 ? (
              <div className="empty-state">No data to compare.</div>
            ) : (
              <div>
                <div style={{ fontSize:"0.78rem", color:"var(--text-light)", marginBottom:10, display:"flex", gap:16 }}>
                  <span><b style={{ color:"var(--green-dark)" }}>{monthLabel(currentMonthStr)}:</b> ${totalThisSpend.toFixed(2)}</span>
                  <span><b style={{ color:"#94a3b8" }}>{monthLabel(lastMonthStr)}:</b> ${totalLastSpend.toFixed(2)}</span>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={compareData} margin={{ top:0, right:0, left:-10, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--green-pale)" />
                    <XAxis dataKey="category" tick={{ fontSize:11, fill:"var(--text-light)" }} />
                    <YAxis tick={{ fontSize:11, fill:"var(--text-light)" }} />
                    <Tooltip formatter={(v) => (v != null ? `$${Number(v).toFixed(2)}` : "")} />
                    <Legend wrapperStyle={{ fontSize:11 }} />
                    <Bar dataKey={monthLabel(currentMonthStr)} fill="var(--green-dark)" radius={[3,3,0,0]} />
                    <Bar dataKey={monthLabel(lastMonthStr)}    fill="#94a3b8"            radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          ) : (
            thisMonth.length === 0 ? (
              <div className="empty-state">No expense data this month.</div>
            ) : (
              <div className="donut-wrap">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={thisMonth} dataKey="total" nameKey="category"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                      {thisMonth.map((row) => (
                        <Cell key={row.category} fill={CATEGORY_COLORS[row.category] ?? DEFAULT_COLOR} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => (v != null ? `$${Number(v).toFixed(2)}` : "")} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-legend">
                  {thisMonth.map((row) => (
                    <div className="legend-item" key={row.category}>
                      <div className="legend-dot" style={{ background: CATEGORY_COLORS[row.category] ?? DEFAULT_COLOR }} />
                      <span>{row.category}</span>
                      <span style={{ color:"var(--text-light)", marginLeft:"auto", paddingLeft:12 }}>
                        {((row.total / totalThisSpend) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div className="card">
            <div className="card-title">Total Balance Overview</div>
            {accounts.map((a) => (
              <div className="event-row" key={a.id}>
                <div>
                  <div className="event-name">{a.nickname}</div>
                  <div className="event-date">{a.type}</div>
                </div>
                <div className={`event-amount ${a.balance >= 0 ? "pos" : "neg"}`}>
                  ${a.balance.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">Upcoming Events</div>
            {bills.length === 0 ? (
              <div className="empty-state">No upcoming bills.</div>
            ) : bills.map((b) => (
              <div className="event-row" key={b.id}>
                <div>
                  <div className="event-name">{b.name} {b.recurring ? `(${b.frequency})` : ""}</div>
                  <div className="event-date">{b.due_date}</div>
                </div>
                <div className={`event-amount ${b.category === "Income" ? "pos" : "neg"}`}>
                  {b.category === "Income" ? "+" : "-"}${b.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}