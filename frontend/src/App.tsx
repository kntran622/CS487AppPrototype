import { useState } from "react";
import Dashboard      from "./pages/Dashboard";
import Transactions   from "./pages/Transactions";
import BudgetGoals    from "./pages/BudgetGoals";
import AlertsCalendar from "./pages/AlertsCalendar";
import Investment     from "./pages/Investment";
import ParentAccount  from "./pages/ParentAccount";
import "./index.css";

type Page = "dashboard" | "transactions" | "budget" | "alerts" | "investment";
type AccountMode = "teen" | "parent";

const TEEN_NAV: { id: Page; label: string; icon: string }[] = [
  { id:"dashboard",    label:"Dashboard",        icon:"🏠" },
  { id:"transactions", label:"Transactions",     icon:"💳" },
  { id:"budget",       label:"Budget & Goals",   icon:"🎯" },
  { id:"alerts",       label:"Alerts & Calendar",icon:"🔔" },
  { id:"investment",   label:"Investment",       icon:"📈" },
];

export default function App() {
  const [page,       setPage]       = useState<Page>("dashboard");
  const [account,    setAccount]    = useState<AccountMode>("teen");
  const [showSwitch, setShowSwitch] = useState(false);

  const switchTo = (mode: AccountMode) => {
    setAccount(mode);
    setShowSwitch(false);
    if (mode === "teen") setPage("dashboard");
  };

  const renderPage = () => {
    if (account === "parent") return <ParentAccount />;
    switch (page) {
      case "dashboard":    return <Dashboard />;
      case "transactions": return <Transactions />;
      case "budget":       return <BudgetGoals />;
      case "alerts":       return <AlertsCalendar />;
      case "investment":   return <Investment />;
    }
  };

  const isParent = account === "parent";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">FinTrack</div>

        <div style={{ position:"relative" }}>
          <div
            className="sidebar-profile"
            onClick={() => setShowSwitch(v => !v)}
            style={{ cursor:"pointer", borderRadius:"var(--radius-sm)", transition:"background 0.15s" }}
            title="Switch account"
          >
            <div className="sidebar-avatar" style={{ background: isParent ? "#6366f1" : "var(--green-mid)" }}>
              {isParent ? "PD" : "JD"}
            </div>
            <div className="sidebar-name">{isParent ? "Pat Doe" : "Jane Doe"}</div>
            <div className="sidebar-email">{isParent ? "patdoe@gmail.com" : "janedoe@gmail.com"}</div>
            <div style={{ fontSize:"0.72rem", color:"var(--text-light)", marginTop:4 }}>
              {isParent ? "👨‍👧 Parent Account" : "👤 Teen Account"} ▾
            </div>
          </div>

          {showSwitch && (
            <div style={{
              position:"absolute", top:"100%", left:0, right:0, zIndex:50,
              background:"white", borderRadius:"var(--radius-sm)", boxShadow:"var(--shadow-md)",
              border:"1px solid var(--green-light)", overflow:"hidden",
            }}>
              <button
                onClick={() => switchTo("teen")}
                style={{
                  width:"100%", padding:"10px 14px", border:"none",
                  background: account==="teen" ? "var(--green-pale)" : "white",
                  cursor:"pointer", textAlign:"left", fontSize:"0.88rem", fontFamily:"inherit",
                  display:"flex", alignItems:"center", gap:8,
                }}
              >
                <span style={{ width:28, height:28, borderRadius:"50%", background:"var(--green-mid)", display:"inline-flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"0.75rem", fontWeight:700 }}>JD</span>
                <div>
                  <div style={{ fontWeight:600 }}>Jane Doe</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--text-light)" }}>Teen Account</div>
                </div>
                {account === "teen" && <span style={{ marginLeft:"auto", color:"var(--green-dark)" }}>✓</span>}
              </button>
              <div style={{ height:1, background:"var(--green-pale)" }} />
              <button
                onClick={() => switchTo("parent")}
                style={{
                  width:"100%", padding:"10px 14px", border:"none",
                  background: account==="parent" ? "var(--green-pale)" : "white",
                  cursor:"pointer", textAlign:"left", fontSize:"0.88rem", fontFamily:"inherit",
                  display:"flex", alignItems:"center", gap:8,
                }}
              >
                <span style={{ width:28, height:28, borderRadius:"50%", background:"#6366f1", display:"inline-flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"0.75rem", fontWeight:700 }}>PD</span>
                <div>
                  <div style={{ fontWeight:600 }}>Pat Doe</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--text-light)" }}>Parent Account</div>
                </div>
                {account === "parent" && <span style={{ marginLeft:"auto", color:"var(--green-dark)" }}>✓</span>}
              </button>
            </div>
          )}
        </div>

        {!isParent && TEEN_NAV.map((n) => (
          <button key={n.id} className={`nav-btn ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}>
            <span className="icon">{n.icon}</span>
            {n.label}
          </button>
        ))}

        {isParent && (
          <div style={{ padding:"8px 14px", fontSize:"0.78rem", color:"var(--text-light)", marginTop:8 }}>
            Viewing Jane's account as parent
          </div>
        )}
      </aside>

      <main className="main-content" onClick={() => setShowSwitch(false)}>
        {renderPage()}
      </main>
    </div>
  );
}