const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "finance.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    merchant TEXT,
    note TEXT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    FOREIGN KEY(account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline TEXT,
    category TEXT,
    created_at TEXT DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    recurring INTEGER DEFAULT 0,
    frequency TEXT,
    category TEXT,
    paid INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS spending_alert_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    threshold REAL NOT NULL,
    phone_notify INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ticker TEXT,
    value REAL NOT NULL,
    gain_loss REAL NOT NULL,
    allocation_pct REAL NOT NULL,
    risk_level TEXT
  );
`);

const accountCount = db.prepare("SELECT COUNT(*) as c FROM accounts").get().c;
if (accountCount === 0) {
  const insertAccount = db.prepare(
    "INSERT INTO accounts (nickname, type, balance) VALUES (?, ?, ?)"
  );
  const checking = insertAccount.run("Main Checking", "checking", 1000.0);
  const savings  = insertAccount.run("Savings",       "savings",  500.0);
  const credit   = insertAccount.run("Credit Card",   "credit",   2040.32);

  const insertTx = db.prepare(
    `INSERT INTO transactions (account_id, amount, category, merchant, note, date, type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  // April 2026 (this month)
  const thisTx = [
    [checking.lastInsertRowid, -55.30,  "Food",    "Whole Foods",      "Weekly groceries",   "2026-04-20", "expense"],
    [checking.lastInsertRowid, -18.99,  "Games",   "Steam",            "New game",           "2026-04-19", "expense"],
    [checking.lastInsertRowid, -12.50,  "Play",    "AMC Theaters",     "Movie night",        "2026-04-18", "expense"],
    [checking.lastInsertRowid, -240.00, "Housing", "State Farm",       "Renters insurance",  "2026-04-17", "expense"],
    [checking.lastInsertRowid, -95.00,  "School",  "Campus Bookstore", "Textbooks",          "2026-04-16", "expense"],
    [checking.lastInsertRowid,  1000.0, "Income",  "Employer",         "Bi-weekly paycheck", "2026-04-15", "income"],
    [savings.lastInsertRowid,   250.0,  "Income",  "Part-time job",    "Weekly pay",         "2026-04-15", "income"],
    [checking.lastInsertRowid, -42.00,  "Food",    "Chipotle",         "Lunch",              "2026-04-14", "expense"],
    [credit.lastInsertRowid,   -89.99,  "Play",    "Spotify + Netflix","Subscriptions",      "2026-04-13", "expense"],
    [checking.lastInsertRowid, -320.00, "Housing", "Landlord",         "April rent partial", "2026-04-12", "expense"],
    [checking.lastInsertRowid,  500.0,  "Income",  "Freelance",        "Design project",     "2026-04-10", "income"],
    [checking.lastInsertRowid, -28.40,  "Food",    "Dunkin",           "Coffee runs",        "2026-04-09", "expense"],
    [credit.lastInsertRowid,   -15.00,  "Games",   "Nintendo",         "Online subscription","2026-04-08", "expense"],
    [checking.lastInsertRowid, -75.00,  "School",  "Tutor",            "Math tutoring",      "2026-04-07", "expense"],
    [checking.lastInsertRowid, -60.00,  "Housing", "ComEd",            "Electric bill",      "2026-04-06", "expense"],
  ];

  // March 2026 (last month)
  const lastTx = [
    [checking.lastInsertRowid, -61.20,  "Food",    "Whole Foods",      "Weekly groceries",   "2026-03-22", "expense"],
    [checking.lastInsertRowid, -34.99,  "Games",   "Steam",            "Spring sale haul",   "2026-03-21", "expense"],
    [checking.lastInsertRowid, -22.00,  "Play",    "Bowling Alley",    "Night out",          "2026-03-20", "expense"],
    [checking.lastInsertRowid, -320.00, "Housing", "Landlord",         "March rent",         "2026-03-19", "expense"],
    [checking.lastInsertRowid, -48.00,  "School",  "Chegg",            "Textbook rental",    "2026-03-17", "expense"],
    [checking.lastInsertRowid,  1000.0, "Income",  "Employer",         "Bi-weekly paycheck", "2026-03-15", "income"],
    [savings.lastInsertRowid,   250.0,  "Income",  "Part-time job",    "Weekly pay",         "2026-03-15", "income"],
    [checking.lastInsertRowid, -38.50,  "Food",    "Trader Joe's",     "Groceries",          "2026-03-14", "expense"],
    [credit.lastInsertRowid,   -89.99,  "Play",    "Spotify + Netflix","Subscriptions",      "2026-03-13", "expense"],
    [checking.lastInsertRowid, -320.00, "Housing", "Landlord",         "March rent pt 2",    "2026-03-10", "expense"],
    [checking.lastInsertRowid,  1000.0, "Income",  "Employer",         "Bi-weekly paycheck", "2026-03-01", "income"],
    [checking.lastInsertRowid, -19.80,  "Food",    "Chipotle",         "Dinner",             "2026-03-08", "expense"],
    [credit.lastInsertRowid,   -15.00,  "Games",   "Nintendo",         "Online subscription","2026-03-07", "expense"],
    [checking.lastInsertRowid, -55.00,  "School",  "Tutor",            "Math session",       "2026-03-05", "expense"],
    [checking.lastInsertRowid, -55.00,  "Housing", "ComEd",            "Electric bill",      "2026-03-04", "expense"],
    [checking.lastInsertRowid, -14.99,  "Play",    "Hulu",             "Streaming",          "2026-03-02", "expense"],
    [checking.lastInsertRowid, -200.00, "Other",   "Amazon",           "Misc shopping",      "2026-03-18", "expense"],
  ];

  for (const row of thisTx) insertTx.run(...row);
  for (const row of lastTx)  insertTx.run(...row);

  const insertGoal = db.prepare(
    `INSERT INTO goals (name, target_amount, current_amount, deadline, category) VALUES (?, ?, ?, ?, ?)`
  );
  insertGoal.run("Emergency Fund",   1000, 420, "2026-12-31", "Savings");
  insertGoal.run("New Laptop",        800, 310, "2026-08-01", "Tech");
  insertGoal.run("Spring Break Trip", 600, 150, "2026-03-01", "Travel");
  insertGoal.run("Car Fund",         2500, 800, "2027-06-01", "Transportation");

  const insertBill = db.prepare(
    `INSERT INTO bills (name, amount, due_date, recurring, frequency, category, paid) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertBill.run("House Rent",      1000,  "2026-04-30", 1, "monthly", "Housing", 0);
  insertBill.run("Part-time Income", 250,  "2026-04-30", 1, "weekly",  "Income",  0);
  insertBill.run("Electric Bill",    60,   "2026-05-05", 1, "monthly", "Housing", 0);
  insertBill.run("Spotify",          10.99,"2026-05-01", 1, "monthly", "Play",    0);
  insertBill.run("Internet",         55,   "2026-05-03", 1, "monthly", "Housing", 1);
  insertBill.run("Student Loan",    200,   "2026-05-15", 1, "monthly", "School",  0);

  const insertAlert = db.prepare(`INSERT INTO alerts (type, message, read) VALUES (?, ?, ?)`);
  insertAlert.run("bill",    "House Rent ($1,000) is due in 2 days.",                0);
  insertAlert.run("anomaly", "Unusual spending detected: $89.99 at Spotify+Netflix.", 0);
  insertAlert.run("goal",    "You're 52% of the way to your Emergency Fund goal!",   0);
  insertAlert.run("bill",    "Student Loan payment due May 15.",                     1);
  insertAlert.run("balance", "Your checking account balance is below $200.",         1);

  const insertRule = db.prepare(
    `INSERT INTO spending_alert_rules (category, threshold, phone_notify) VALUES (?, ?, ?)`
  );
  insertRule.run("Food",    100, 0);
  insertRule.run("Housing", 700, 1);

  const insertInv = db.prepare(
    `INSERT INTO investments (name, ticker, value, gain_loss, allocation_pct, risk_level) VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertInv.run("S&P 500 Index Fund", "VOO",  1200,  142.50, 48, "Low");
  insertInv.run("Tech Growth ETF",    "QQQ",   600,   88.20, 24, "Medium");
  insertInv.run("Apple Inc.",         "AAPL",  400,  -22.10, 16, "Medium");
  insertInv.run("Bitcoin",            "BTC",   300,   65.00, 12, "High");

  console.log("✅  Database seeded with sample data.");
}

module.exports = db;