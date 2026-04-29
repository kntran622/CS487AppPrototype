const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Accounts
app.get("/api/accounts", (req, res) => {
  res.json(db.prepare("SELECT * FROM accounts").all());
});

// Transactions
app.get("/api/transactions", (req, res) => {
  res.json(db.prepare(
    `SELECT t.*, a.nickname as account_name
     FROM transactions t
     JOIN accounts a ON t.account_id = a.id
     ORDER BY t.date DESC`
  ).all());
});

app.post("/api/transactions", (req, res) => {
  const { account_id, amount, category, merchant, note, date, type } = req.body;
  const result = db.prepare(
    `INSERT INTO transactions (account_id, amount, category, merchant, note, date, type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(account_id, amount, category, merchant, note, date, type);
  res.json({ id: result.lastInsertRowid });
});

app.put("/api/transactions/:id", (req, res) => {
  const { category, merchant, note } = req.body;
  db.prepare(`UPDATE transactions SET category=?, merchant=?, note=? WHERE id=?`)
    .run(category, merchant, note, req.params.id);
  res.json({ ok: true });
});

app.delete("/api/transactions/:id", (req, res) => {
  db.prepare("DELETE FROM transactions WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// Spending summary
app.get("/api/spending-summary", (req, res) => {
  const month = req.query.month;
  const rows = month
    ? db.prepare(`SELECT category, SUM(ABS(amount)) as total FROM transactions WHERE type='expense' AND strftime('%Y-%m', date) = ? GROUP BY category`).all(month)
    : db.prepare(`SELECT category, SUM(ABS(amount)) as total FROM transactions WHERE type='expense' GROUP BY category`).all();
  res.json(rows);
});

// Goals
app.get("/api/goals", (req, res) => {
  res.json(db.prepare("SELECT * FROM goals ORDER BY created_at DESC").all());
});

app.post("/api/goals", (req, res) => {
  const { name, target_amount, current_amount, deadline, category } = req.body;
  const result = db.prepare(
    `INSERT INTO goals (name, target_amount, current_amount, deadline, category) VALUES (?, ?, ?, ?, ?)`
  ).run(name, target_amount, current_amount ?? 0, deadline, category);
  res.json({ id: result.lastInsertRowid });
});

app.put("/api/goals/:id/edit", (req, res) => {
  const { name, target_amount, current_amount, deadline, category } = req.body;
  db.prepare(`UPDATE goals SET name=?, target_amount=?, current_amount=?, deadline=?, category=? WHERE id=?`)
    .run(name, target_amount, current_amount, deadline, category, req.params.id);
  res.json({ ok: true });
});

app.put("/api/goals/:id", (req, res) => {
  const { current_amount } = req.body;
  db.prepare(`UPDATE goals SET current_amount=? WHERE id=?`).run(current_amount, req.params.id);
  res.json({ ok: true });
});

app.delete("/api/goals/:id", (req, res) => {
  db.prepare("DELETE FROM goals WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// Bills
app.get("/api/bills", (req, res) => {
  res.json(db.prepare("SELECT * FROM bills ORDER BY due_date ASC").all());
});

app.post("/api/bills", (req, res) => {
  const { name, amount, due_date, recurring, frequency, category } = req.body;
  const result = db.prepare(
    `INSERT INTO bills (name, amount, due_date, recurring, frequency, category, paid) VALUES (?, ?, ?, ?, ?, ?, 0)`
  ).run(name, amount, due_date, recurring ? 1 : 0, frequency, category);
  res.json({ id: result.lastInsertRowid });
});

app.put("/api/bills/:id/paid", (req, res) => {
  db.prepare(`UPDATE bills SET paid=1 WHERE id=?`).run(req.params.id);
  res.json({ ok: true });
});

app.delete("/api/bills/:id", (req, res) => {
  db.prepare("DELETE FROM bills WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// Alerts
app.get("/api/alerts", (req, res) => {
  res.json(db.prepare("SELECT * FROM alerts ORDER BY created_at DESC").all());
});

app.put("/api/alerts/:id/read", (req, res) => {
  db.prepare("UPDATE alerts SET read=1 WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// Spending alert rules
app.get("/api/alert-rules", (req, res) => {
  res.json(db.prepare("SELECT * FROM spending_alert_rules ORDER BY created_at DESC").all());
});

app.post("/api/alert-rules", (req, res) => {
  const { category, threshold, phone_notify } = req.body;
  db.prepare("DELETE FROM spending_alert_rules WHERE category=?").run(category);
  const result = db.prepare(
    `INSERT INTO spending_alert_rules (category, threshold, phone_notify) VALUES (?, ?, ?)`
  ).run(category, threshold, phone_notify ? 1 : 0);
  res.json({ id: result.lastInsertRowid });
});

app.put("/api/alert-rules/:id", (req, res) => {
  const { threshold, phone_notify } = req.body;
  db.prepare(`UPDATE spending_alert_rules SET threshold=?, phone_notify=? WHERE id=?`)
    .run(threshold, phone_notify ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.delete("/api/alert-rules/:id", (req, res) => {
  db.prepare("DELETE FROM spending_alert_rules WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// Investments
app.get("/api/investments", (req, res) => {
  res.json(db.prepare("SELECT * FROM investments").all());
});

// Health score
app.get("/api/health-score", (req, res) => {
  const income   = db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='income'`).get().total;
  const expenses = db.prepare(`SELECT COALESCE(SUM(ABS(amount)),0) as total FROM transactions WHERE type='expense'`).get().total;
  const savings  = db.prepare(`SELECT COALESCE(SUM(current_amount),0) as total FROM goals`).get().total;
  const savingsScore  = income > 0 ? Math.min(savings / income, 1) : 0;
  const spendingScore = income > 0 ? Math.min(expenses / income, 1) : 1;
  const score = Math.round((0.4 * savingsScore + 0.6 * (1 - spendingScore)) * 100);
  res.json({ score: Math.max(0, Math.min(100, score)), income, expenses, savings });
});

app.listen(3001, () => console.log("✅  API running on http://localhost:3001"));