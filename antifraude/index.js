const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// FASE 2: GET /api/init-session?store_id=123
app.get('/api/init-session', (req, res) => {
  const storeId = req.query.store_id;
  if (!storeId) return res.status(400).json({ error: 'Store required' });

  db.get("SELECT secret_key FROM stores WHERE id = ?", [storeId], (err, store) => {
    if (err || !store) return res.status(404).json({ error: 'Store not found' });

    const secretKey = store.secret_key;
    const timeWindow = Math.floor(Date.now() / 300000);
    const token = crypto.createHmac('sha256', secretKey)
      .update(storeId.toString() + timeWindow.toString())
      .digest('hex');

    let salt = req.cookies.__device_salt;
    if (!salt) {
      salt = crypto.randomBytes(16).toString('hex');
      res.cookie('__device_salt', salt, { maxAge: 86400000, httpOnly: true });
    }

    const headers = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['sec-ch-ua'] || '',
      req.headers['sec-ch-ua-platform'] || ''
    ].join('|');

    const deviceId = crypto.createHash('sha256')
      .update(headers + salt)
      .digest('hex');

    const timestamp = Date.now();
    const sessionToken = crypto.createHmac('sha256', secretKey)
      .update(storeId.toString() + timestamp.toString() + deviceId)
      .digest('hex');

    db.run("INSERT INTO sessions (session_token, store_id, device_id, used, attempts) VALUES (?, ?, ?, 0, 0)", 
      [sessionToken, storeId, deviceId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed' });
      res.json({ token, session_token: sessionToken, expires_in: 180 });
    });
  });
});

// FASE 4 & 5: POST /api/request-point
app.post('/api/request-point', async (req, res) => {
  const { phone, store_id, token, session_token, time_on_page, interacted } = req.body;
  
  const pendingResponse = { status: "pending", message: "Ponto enviado para análise." };
  const approvedResponse = { status: "approved" };

  try {
    // 1. Get store & session info
    const store = await new Promise((resolve) => db.get("SELECT * FROM stores WHERE id = ?", [store_id], (e, r) => resolve(r)));
    if (!store) return res.json(pendingResponse);

    const session = await new Promise((resolve) => db.get("SELECT * FROM sessions WHERE session_token = ?", [session_token], (e, r) => resolve(r)));
    if (!session) return res.json(pendingResponse);

    // 2. Validate Device ID
    let salt = req.cookies.__device_salt;
    const headers = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['sec-ch-ua'] || '',
      req.headers['sec-ch-ua-platform'] || ''
    ].join('|');
    const currentDeviceId = crypto.createHash('sha256').update(headers + (salt || '')).digest('hex');

    // --- REGRAS FASE 4 ---

    // 1. Rate limit loja (last minute > rate_limit * 1.2)
    const pointsLastMin = await new Promise((resolve) => 
      db.get("SELECT COUNT(*) as cnt FROM points WHERE store_id = ? AND created_at > datetime('now', '-1 minute')", [store_id], (e, r) => resolve(r.cnt)));
    if (pointsLastMin > store.rate_limit * 1.2) return res.json(pendingResponse);

    // 2. Validar token (HMAC window)
    const timeWindow = Math.floor(Date.now() / 300000);
    const validToken = crypto.createHmac('sha256', store.secret_key)
      .update(store_id.toString() + timeWindow.toString())
      .digest('hex');
    if (token !== validToken) return res.json(pendingResponse);

    // 3. Validar sessão: used, age, device_id
    const age = Math.floor((Date.now() - new Date(session.created_at + 'Z').getTime()) / 1000);
    if (session.used || age > 180 || session.device_id !== currentDeviceId) return res.json(pendingResponse);

    // 4. Limite de tentativas
    if (session.attempts >= 3) return res.json(pendingResponse);
    await new Promise(r => db.run("UPDATE sessions SET attempts = attempts + 1 WHERE session_token = ?", [session_token], r));

    // 5. Validar tempo na página
    if (time_on_page < 4 || time_on_page > age + 10) return res.json(pendingResponse);

    // 6. Validar interação
    if (!interacted) return res.json(pendingResponse);

    // 7. Cooldown 12h por telefone
    const phonePointsLast12h = await new Promise((resolve) => 
      db.get("SELECT COUNT(*) as cnt FROM points p JOIN users u ON p.user_id = u.id WHERE u.phone = ? AND p.store_id = ? AND p.created_at > datetime('now', '-12 hours')", [phone, store_id], (e, r) => resolve(r ? r.cnt : 0)));
    if (phonePointsLast12h > 0) return res.json(pendingResponse);

    // --- FASE 5: RISCO ---
    let risk = 0;

    // deviceUsers (last 60m)
    const deviceUsers = await new Promise((resolve) => 
      db.get("SELECT COUNT(DISTINCT user_id) as cnt FROM points WHERE store_id = ? AND created_at > datetime('now', '-1 hour')", [store_id], (e, r) => resolve(r.cnt)));
    if (deviceUsers > 5) risk += 2;

    if (session.attempts > 1) risk += 2;
    if (time_on_page < 5) risk += 1;

    // Decisão Plano ELITE
    if (risk >= 5) {
      return res.json(pendingResponse);
    }

    // --- SUCESSO ---
    // Get/Create User
    let user = await new Promise((resolve) => db.get("SELECT id FROM users WHERE phone = ?", [phone], (e, r) => resolve(r)));
    if (!user) {
      await new Promise(resolve => db.run("INSERT INTO users (phone) VALUES (?)", [phone], function(e) { user = { id: this.lastID }; resolve(); }));
    }

    // Save point
    await new Promise(resolve => db.run("INSERT INTO points (user_id, store_id, status, risk_score) VALUES (?, ?, ?, ?)", 
      [user.id, store_id, 'approved', risk], resolve));

    // Mark session used
    await new Promise(resolve => db.run("UPDATE sessions SET used = 1 WHERE session_token = ?", [session_token], resolve));

    return res.json(approvedResponse);

  } catch (err) {
    // In case of any error, always return pending per requirements
    return res.json(pendingResponse);
  }
});

const PORT = 3333;
app.listen(PORT, () => console.log(`Antifraude server running on port ${PORT}`));
