const axios = require('axios');
const http = require('http');

const BASE_URL = 'http://localhost:3333';

async function runTests() {
  console.log('🚀 INICIANDO TESTES ANTIFRAUDE\n');

  // Helper: init session
  async function initSession() {
    const res = await axios.get(`${BASE_URL}/api/init-session?store_id=1`);
    return {
      token: res.data.token,
      sessionToken: res.data.session_token,
      cookie: res.headers['set-cookie'][0]
    };
  }

  // TEST 1: Fluxo Normal (wait 5s, interacted=true)
  console.log('[TEST 1] Fluxo Normal (+5s, interativo)');
  const s1 = await initSession();
  await new Promise(r => setTimeout(r, 5000));
  const r1 = await axios.post(`${BASE_URL}/api/request-point`, {
    phone: '11999999999',
    store_id: 1,
    token: s1.token,
    session_token: s1.sessionToken,
    time_on_page: 5,
    interacted: true
  }, { headers: { Cookie: s1.cookie } });
  console.log('INPUT:', { phone: '11999999999', time: 5, interacted: true });
  console.log('RESPONSE:', r1.data);
  console.log(r1.data.status === 'approved' ? '✅ PASSED' : '❌ FAILED');
  console.log('---');

  // TEST 2: Muito Rápido (< 4s)
  console.log('[TEST 2] Muito Rápido (2s)');
  const s2 = await initSession();
  const r2 = await axios.post(`${BASE_URL}/api/request-point`, {
    phone: '11888888888',
    store_id: 1,
    token: s2.token,
    session_token: s2.sessionToken,
    time_on_page: 2,
    interacted: true
  }, { headers: { Cookie: s2.cookie } });
  console.log('INPUT:', { phone: '11888888888', time: 2 });
  console.log('RESPONSE:', r2.data);
  console.log(r2.data.status === 'pending' ? '✅ PASSED' : '❌ FAILED');
  console.log('---');

  // TEST 3: Sem Interação
  console.log('[TEST 3] Sem interação');
  const s3 = await initSession();
  await new Promise(r => setTimeout(r, 4500));
  const r3 = await axios.post(`${BASE_URL}/api/request-point`, {
    phone: '11777777777',
    store_id: 1,
    token: s3.token,
    session_token: s3.sessionToken,
    time_on_page: 5,
    interacted: false
  }, { headers: { Cookie: s3.cookie } });
  console.log('INPUT:', { phone: '11777777777', interacted: false });
  console.log('RESPONSE:', r3.data);
  console.log(r3.data.status === 'pending' ? '✅ PASSED' : '❌ FAILED');
  console.log('---');

  // TEST 4: Cooldown 12h
  console.log('[TEST 4] Cooldown 12h (repetir phone TEST 1)');
  const s4 = await initSession();
  await new Promise(r => setTimeout(r, 4500));
  const r4 = await axios.post(`${BASE_URL}/api/request-point`, {
    phone: '11999999999',
    store_id: 1,
    token: s4.token,
    session_token: s4.sessionToken,
    time_on_page: 5,
    interacted: true
  }, { headers: { Cookie: s4.cookie } });
  console.log('INPUT:', { phone: '11999999999' });
  console.log('RESPONSE:', r4.data);
  console.log(r4.data.status === 'pending' ? '✅ PASSED' : '❌ FAILED');
  console.log('---');

  // TEST 5: Replay (used session s1)
  console.log('[TEST 5] Replay (Session Used)');
  const r5 = await axios.post(`${BASE_URL}/api/request-point`, {
    phone: '11111111111',
    store_id: 1,
    token: s1.token,
    session_token: s1.sessionToken,
    time_on_page: 5,
    interacted: true
  }, { headers: { Cookie: s1.cookie } });
  console.log('INPUT:', { session_token: s1.sessionToken });
  console.log('RESPONSE:', r5.data);
  console.log(r5.data.status === 'pending' ? '✅ PASSED' : '❌ FAILED');
  console.log('---');

  process.exit();
}

runTests();
