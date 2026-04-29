import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { api } from "../api";

const COLORS = ["#2d6a4f","#52b788","#40916c","#74c69d","#b7e4c7","#1b4332"];
const RISK_COLOR: Record<string,string> = { Low:"#52b788", Medium:"#f4a261", High:"#e63946" };

interface Investment { id: number; name: string; ticker: string; value: number; gain_loss: number; allocation_pct: number; risk_level: string }

export default function Investment() {
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    api.get<Investment[]>("/investments").then(setInvestments);
  }, []);

  const totalValue = investments.reduce((s, i) => s + i.value, 0);
  const totalGain  = investments.reduce((s, i) => s + i.gain_loss, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Investment Portfolio</h1>
      </div>

      <div className="stat-row">
        <div className="stat-chip">
          <div className="label">Portfolio Value</div>
          <div className="value green">${totalValue.toFixed(2)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Total Gain/Loss</div>
          <div className={`value ${totalGain >= 0 ? "green" : "red"}`}>
            {totalGain >= 0 ? "+" : ""}${totalGain.toFixed(2)}
          </div>
        </div>
        <div className="stat-chip">
          <div className="label">Holdings</div>
          <div className="value">{investments.length}</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Allocation donut */}
        <div className="card">
          <div className="card-title">Asset Allocation</div>
          {investments.length === 0 ? (
            <div className="empty-state">No investments linked.</div>
          ) : (
            <div className="donut-wrap">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={investments} dataKey="value" nameKey="ticker"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {investments.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => (v != null ? `$${Number(v).toFixed(2)}` : "")} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-legend">
                {investments.map((inv, i) => (
                  <div className="legend-item" key={inv.id}>
                    <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontWeight:600 }}>{inv.ticker}</span>
                    <span style={{ color:"var(--text-light)", paddingLeft:8 }}>{inv.allocation_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar chart: gain/loss */}
        <div className="card">
          <div className="card-title">Gain / Loss by Holding</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={investments} margin={{ top:0, right:0, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--green-pale)" />
              <XAxis dataKey="ticker" tick={{ fontSize:12, fill:"var(--text-light)" }} />
              <YAxis tick={{ fontSize:11, fill:"var(--text-light)" }} />
              <Tooltip formatter={(v) => (v != null ? `$${Number(v).toFixed(2)}` : "")} />
              <Bar dataKey="gain_loss" name="Gain/Loss" radius={[4,4,0,0]}>
                {investments.map((inv, i) => (
                  <Cell key={i} fill={inv.gain_loss >= 0 ? "#52b788" : "#e63946"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings table */}
      <div className="card section-gap">
        <div className="card-title">Holdings</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticker</th><th>Name</th><th>Value</th>
                <th>Gain/Loss</th><th>Allocation</th><th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id}>
                  <td className="inv-ticker">{inv.ticker}</td>
                  <td className="inv-name">{inv.name}</td>
                  <td className="inv-value">${inv.value.toFixed(2)}</td>
                  <td className={`inv-gain ${inv.gain_loss >= 0 ? "pos" : "neg"}`}>
                    {inv.gain_loss >= 0 ? "+" : ""}${inv.gain_loss.toFixed(2)}
                  </td>
                  <td className="inv-alloc">{inv.allocation_pct}%</td>
                  <td>
                    <span style={{
                      display:"inline-block", padding:"3px 10px", borderRadius:20,
                      fontSize:"0.75rem", fontWeight:600,
                      background: RISK_COLOR[inv.risk_level] + "30",
                      color: RISK_COLOR[inv.risk_level],
                    }}>
                      {inv.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}