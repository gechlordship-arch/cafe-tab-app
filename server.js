const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3000;

// ================= DATABASE =================
const db = new Database('cafetab.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS consumptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ================= SESSIONS =================
const sessions = new Map();

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

function auth(roles) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.replace('Bearer ', '');
    const s = sessions.get(token);
    if (!s) return res.status(401).json({ error: 'Not logged in' });
    if (roles && !roles.includes(s.role)) return res.status(403).json({ error: 'Forbidden' });
    req.user = s;
    next();
  };
}

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================= SETUP & LOGIN =================
app.get('/api/setup-status', (req, res) => {
  const m = db.prepare('SELECT COUNT(*) AS n FROM managers').get().n;
  const s = db.prepare('SELECT COUNT(*) AS n FROM staff').get().n;
  const c = db.prepare('SELECT COUNT(*) AS n FROM customers').get().n;
  res.json({ needsSetup: m === 0, managers: m, staff: s, customers: c });
});

app.post('/api/setup', (req, res) => {
  const n = db.prepare('SELECT COUNT(*) AS n FROM managers').get().n;
  if (n > 0) return res.status(400).json({ error: 'Setup already done' });
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'All fields required' });
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO managers (name, phone, password) VALUES (?, ?, ?)').run(name, phone, hash);
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { phone, password, role } = req.body;
  if (!phone || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['manager','staff','customer'].includes(role)) return res.status(400).json({ error: 'Bad role' });

  const table = role === 'manager' ? 'managers' : role === 'staff' ? 'staff' : 'customers';
  const user = db.prepare(`SELECT * FROM ${table} WHERE phone = ?`).get(phone);
  if (!user) return res.status(401).json({ error: `No ${role} with that phone number` });
  if (!user.password || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = newToken();
  sessions.set(token, { role, id: user.id, name: user.name });
  res.json({ token, role, name: user.name });
});

app.post('/api/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/me', auth(), (req, res) => {
  res.json(req.user);
});

// ================= PASSWORD RESET (manager only) =================
app.post('/api/reset-password', auth(['manager']), (req, res) => {
  const { role, id, new_password } = req.body;
  if (!['staff','customer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (!new_password || new_password.length < 3) return res.status(400).json({ error: 'Password too short' });
  const table = role === 'staff' ? 'staff' : 'customers';
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare(`UPDATE ${table} SET password = ? WHERE id = ?`).run(hash, id);
  res.json({ ok: true });
});

// ================= MENU =================
app.get('/api/menu', auth(['manager', 'staff']), (req, res) => {
  res.json(db.prepare('SELECT * FROM menu_items ORDER BY name').all());
});

app.post('/api/menu', auth(['manager']), (req, res) => {
  const { name, price } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Name and price required' });
  const info = db.prepare('INSERT INTO menu_items (name, price) VALUES (?, ?)').run(name, price);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/menu/:id', auth(['manager']), (req, res) => {
  db.prepare('DELETE FROM consumptions WHERE menu_item_id = ?').run(req.params.id);
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ================= CUSTOMERS =================
app.get('/api/customers', auth(['manager', 'staff']), (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.phone,
      IFNULL(SUM(cs.qty * cs.price), 0) AS total
    FROM customers c
    LEFT JOIN consumptions cs ON cs.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  res.json(rows);
});

app.post('/api/customers', auth(['manager']), (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'All fields required' });
  const exists = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone);
  if (exists) return res.status(400).json({ error: 'That phone number is already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO customers (name, phone, password) VALUES (?, ?, ?)').run(name, phone, hash);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/customers/:id', auth(['manager']), (req, res) => {
  db.prepare('DELETE FROM consumptions WHERE customer_id = ?').run(req.params.id);
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/customers/:id/pay', auth(['manager']), (req, res) => {
  db.prepare('DELETE FROM consumptions WHERE customer_id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ================= STAFF =================
app.get('/api/staff', auth(['manager']), (req, res) => {
  res.json(db.prepare('SELECT id, name, phone FROM staff ORDER BY name').all());
});

app.post('/api/staff', auth(['manager']), (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'All fields required' });
  const exists = db.prepare('SELECT id FROM staff WHERE phone = ?').get(phone);
  if (exists) return res.status(400).json({ error: 'That phone number is already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO staff (name, phone, password) VALUES (?, ?, ?)').run(name, phone, hash);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/staff/:id', auth(['manager']), (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ================= RECORD MEAL =================
app.post('/api/consume', auth(['manager', 'staff']), (req, res) => {
  const { customer_id, items, password } = req.body;
  if (!customer_id || !items || !password) return res.status(400).json({ error: 'Missing fields' });

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  if (!customer.password || !bcrypt.compareSync(password, customer.password)) {
    return res.status(401).json({ error: 'Wrong customer password' });
  }

  const insert = db.prepare('INSERT INTO consumptions (customer_id, menu_item_id, qty, price) VALUES (?, ?, ?, ?)');
  const menuGet = db.prepare('SELECT * FROM menu_items WHERE id = ?');

  const tx = db.transaction(() => {
    for (const item of items) {
      const menu = menuGet.get(item.menu_item_id);
      if (!menu) continue;
      insert.run(customer_id, menu.id, item.qty, menu.price);
    }
  });
  tx();

  res.json({ ok: true });
});

// ================= CUSTOMER SELF-VIEW =================
app.get('/api/me/consumptions', auth(['customer']), (req, res) => {
  const rows = db.prepare(`
    SELECT cs.id, cs.qty, cs.price, cs.created_at, m.name AS item_name
    FROM consumptions cs
    JOIN menu_items m ON m.id = cs.menu_item_id
    WHERE cs.customer_id = ?
    ORDER BY cs.id DESC
  `).all(req.user.id);
  const total = rows.reduce((s, r) => s + r.qty * r.price, 0);
  res.json({ rows, total });
});

// ================= START =================
app.listen(PORT, () => {
  console.log(`✅ CafeTab running at http://localhost:${PORT}`);
});