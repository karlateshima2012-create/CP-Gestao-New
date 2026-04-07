const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const db = new sqlite3.Database('./antifraude.db');

db.serialize(() => {
  // 1. Create stores table
  db.run(`CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    plan TEXT DEFAULT 'elite',
    rate_limit INTEGER DEFAULT 30
  )`);

  // 2. Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 3. Create points table
  db.run(`CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    store_id INTEGER,
    status TEXT,
    risk_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(store_id) REFERENCES stores(id)
  )`);

  // 4. Create sessions table
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    store_id INTEGER,
    device_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT 0,
    attempts INTEGER DEFAULT 0
  )`);

  // Create test store if not exists
  const testStoreName = 'Loja Teste Elite';
  db.get("SELECT id FROM stores WHERE name = ?", [testStoreName], (err, row) => {
    if (!row) {
      const secret = crypto.randomBytes(32).toString('hex');
      db.run("INSERT INTO stores (name, secret_key, plan, rate_limit) VALUES (?, ?, ?, ?)", [testStoreName, secret, 'elite', 30], function(err) {
        if (err) return console.error(err.message);
        console.log(`Loja criada: ${testStoreName} (id: ${this.lastID})`);
        console.log(`Secret: ${secret}`);
      });
    }
  });
});

module.exports = db;
