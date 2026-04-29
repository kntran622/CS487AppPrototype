import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api";

const COLORS = ["#52b788","#2d6a4f","#b7e4c7","#40916c","#74c69d","#1b4332"];

const CATEGORY_LABELS: Record<string, string> = {
  Food: "Food", Housing: "Housing", School: "School",
  Games: "Games", Play: "Play", Other: "Other",
};

interface Account  { id: number; nickname: string; type: string; balance: number }
interface Summary  { category: string; total: number }
interface Bill     { id: number; name: string; amount: number; due_date: string; recurring: number; frequency: string; category: string; paid: number }
interface Health   { score: number; income: number; expenses: number; savings: number }

export default function Dashboard() {
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [summary,  setSummary]    = useState<Summary[]>([]);
  const [bills,    setBills]      = useState<Bill[]>([]);
  const [health,   setHealth]     = useState<Health | null>(null);

  useEffect(() => {
    api.get<Account[]>("/accounts").then(setAccounts);
    api.get<Summary[]>("/spending-summary").then(setSummary);
    api.get<Bill[]>("/bills").then((b) => setBills(b.filter((x) => !x.paid).slice(0, 5)));
    api.get<Health>("/health-score").then(setHealth);
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalSpend   = summary.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>
          {new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </span>
      </div>

      {/* Stat row */}
      <div className="stat-row">
        <div className="stat-chip">
          <div className="label">Total Balance</div>
          <div className="value green">${totalBalance.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Monthly Spend</div>
          <div className="value red">${totalSpend.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Accounts</div>
          <div className="value">{accounts.length}</div>
        </div>
        {health && (
          <div className="stat-chip">
            <div className="label">Health Score</div>
            <div className="value green">{health.score}/100</div>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Spending donut */}
        <div className="card">
          <div className="card-title">Spending Summary</div>
          {summary.length === 0 ? (
            <div className="empty-state">No expense data yet.</div>
          ) : (
            <div className="donut-wrap">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={summary} dataKey="total" nameKey="category"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                    {summary.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => (v != null ? `$${Number(v).toFixed(2)}` : "")} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-legend">
                {summary.map((row, i) => (
                  <div className="legend-item" key={row.category}>
                    <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                    <span>{CATEGORY_LABELS[row.category] ?? row.category}</span>
                    <span style={{ color:"var(--text-light)", marginLeft:"auto", paddingLeft:12 }}>
                      {((row.total / totalSpend) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Accounts + Upcoming */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Total balance overview */}
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

          {/* Upcoming bills */}
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