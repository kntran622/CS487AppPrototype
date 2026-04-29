import { useState } from "react";
import Dashboard      from "./pages/Dashboard";
import Transactions   from "./pages/Transactions";
import BudgetGoals    from "./pages/BudgetGoals";
import AlertsCalendar from "./pages/AlertsCalendar";
import Investment     from "./pages/Investment";
import "./index.css";

type Page = "dashboard" | "transactions" | "budget" | "alerts" | "investment";

const NAV: { id: Page; label: string; icon: string }[] = [
  { id:"dashboard",    label:"Dashboard",      icon:"🏠" },
  { id:"transactions", label:"Transactions",   icon:"💳" },
  { id:"budget",       label:"Budget & Goals", icon:"🎯" },
  { id:"alerts",       label:"Alerts & Calendar", icon:"🔔" },
  { id:"investment",   label:"Investment",     icon:"📈" },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard":    return <Dashboard />;
      case "transactions": return <Transactions />;
      case "budget":       return <BudgetGoals />;
      case "alerts":       return <AlertsCalendar />;
      case "investment":   return <Investment />;
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">FinTrack</div>

        <div className="sidebar-profile">
          <div className="sidebar-avatar">JD</div>
          <div className="sidebar-name">Jane Doe</div>
          <div className="sidebar-email">janedoe@gmail.com</div>
        </div>

        {NAV.map((n) => (
          <button key={n.id} className={`nav-btn ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}>
            <span className="icon">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </aside>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}