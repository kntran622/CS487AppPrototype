# CS487AppPrototype
# FinTrack — Personal Finance Management App (Prototype)

A locally-run personal finance management web application built for CS 487 (Software Engineering) by Team G. Designed for teenagers and young adults to track spending, manage budgets, set savings goals, and monitor investments. Includes a linked parent account view for optional financial supervision.

---

## What It Does

### Teen Account (Jane Doe)
- **Dashboard** — spending donut chart by category, total balance across all accounts, upcoming bills, and a financial health score. Toggle between the donut view and a side-by-side bar chart comparing this month's spending to last month.
- **Transactions** — full list of income and expenses across all accounts. Filter by category, add new transactions manually, edit the category/merchant/note on existing ones, and delete entries.
- **Budget & Goals** — create savings goals with a target amount, deadline, and category. Track progress with a visual progress bar. Contribute funds via an in-app modal, edit any goal's details, or delete it.
- **Alerts & Calendar** — view and dismiss in-app notifications (bill reminders, unusual spending, low balance, goal milestones). Manage upcoming bills — mark as paid or delete. Create spending alert rules that trigger a notification when a category exceeds a monthly dollar threshold, with an optional phone notification toggle.
- **Investment** — view a mock portfolio with asset allocation donut chart, gain/loss bar chart, and a holdings table showing value, performance, and risk level per asset.

### Parent Account (Pat Doe)
- Linked to Jane's account — accessible by clicking the profile in the sidebar and switching accounts.
- Shows Jane's full spending breakdown, active unread alerts, and recent transactions (read-only).
- Manage allowances — add, pause/resume, and remove recurring allowance entries with weekly or monthly frequency.

---

## Tech Stack

| Frontend | React + TypeScript (Vite) |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Charts | Recharts |

---

## How to Run

You need **Node.js** installed. You will run two terminals simultaneously — one for the backend, one for the frontend.

### 1. Install dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start the backend

```bash
cd backend
node server.js
```

The API will start at `http://localhost:5173`. On first run it automatically creates `finance.db` and seeds it with sample data for Jane Doe (teen) and Pat Doe (parent), including two months of transaction history (March and April 2026).

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:5173`.

---

## Resetting to Default Data

If you want to wipe all changes and restore the original seed data:

1. Stop the backend server
2. Delete `backend/finance.db`
3. Restart the server with `node server.js`

The database will be recreated and reseeded automatically.
---
## Notes

- All data is local — nothing is sent to any external service.
- Bank/investment data is simulated. There is no real third-party API integration (e.g. Plaid) in this prototype.
- The phone notification toggle on spending alert rules is stored in the database but does not send actual push notifications — this would require a production backend with a notification service.