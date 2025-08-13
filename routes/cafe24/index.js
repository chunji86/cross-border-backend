// routes/cafe24/index.js
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const router = express.Router();
const { saveToken } = require('../../utils/tokenManager');

// ====== 환경변수 ======
const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI;
const DEFAULT_SCOPE = process.env.CAFE24_SCOPE || 'mall.read_product mall.write_product';
// 허용 mall_id 화이트리스트(비워두면 전체 허용)
const ALLOWED = (process.env.ALLOWED_MALL_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ====== 간단 nonce 저장소(메모리) ======
const _nonce = new Map(); // nonce -> exp(ms)
function issueNonce(ttlSec = 300) {
  const n = Math.random().toString(36).slice(2) + Date.now().toString(36);
  _nonce.set(n, Date.now() + ttlSec * 1000);
  return n;
}
function consumeNonce(n) {
  const exp = _nonce.get(n);
  if (!exp) return false;
  _nonce.delete(n);
  return Date.now() <= exp;
}

// ====== 핑/디버그 ======
router.get('/', (req, res) => res.json({ ok: true, where: '/api/cafe24 (from router)' }));
router.get('/__routes', (req, res) => {
  const list = (router.stack || [])
    .filter(l => l.route && l.route.path)
    .map(l => ({
      path: '/api/cafe24' + l.route.path,
      methods: Object.keys(l.route.methods).filter(m => l.route.methods[m]).map(m => m.toUpperCase()),
    }));
  res.json({ ok: true, routes: list });
});

// ====== 설치 시작 ======
router.get('/start', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).send('mall_id 파라미터가 필요합니다.');
    if (!CAFE24_CLIENT_ID || !CAFE24_CLIENT_SECRET || !CAFE24_REDIRECT_URI) {
      return res.status(500).send('환경변수(CAFE24_CLIENT_ID/SECRET/REDIRECT_URI)를 확인하세요.');
    }
    if (ALLOWED.length && !ALLOWED.includes(mall_id)) {
      return res.status(403).send('허용되지 않은 mall_id');
    }

    const nonce = issueNonce(); // 🔐 anti-CSRF
    const state = `${mall_id}:${shop_no}:${Date.now()}:${nonce}`;
    const base = `https://${mall_id}.cafe24api.com`;
    const authUrl =
      `${base}/api/v2/oauth/authorize?` +
      querystring.stringify({
        response_type: 'code',
        client_id: CAFE24_CLIENT_ID,
        redirect_uri: CAFE24_REDIRECT_URI,
        scope: DEFAULT_SCOPE,
        state,
        shop_no,
      });

    return res.redirect(authUrl);
  } catch (e) {
    console.error('[/api/cafe24/start] error:', e.message);
    return res.status(500).send('설치 시작 실패');
  }
});

// ====== 콜백(토큰 교환) ======
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send('code/state가 없습니다.');
    const [mall_id, shop_no_str, ts, nonce] = String(state).split(':');

    // nonce 검증
    if (!consumeNonce(nonce)) return res.status(400).send('잘못되었거나 만료된 state');

    const tokenUrl = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;
    const body = querystring.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CAFE24_REDIRECT_URI,
      client_id: CAFE24_CLIENT_ID,
      client_secret: CAFE24_CLIENT_SECRET,
    });
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${CAFE24_CLIENT_ID}:${CAFE24_CLIENT_SECRET}`).toString('base64'),
    };

    const resp = await axios.post(tokenUrl, body, { headers });
    const saved = saveToken(mall_id, resp.data);
    return res.json({
      ok: true,
      mall_id,
      token_saved: true,
      expires_in: saved.expires_in ?? null,
    });
  } catch (e) {
    console.error('[/api/cafe24/callback] error:', e.response?.data || e.message);
    return res.status(500).json({ error: '카페24 토큰 요청 실패', detail: e.response?.data || e.message });
  }
});

// 하위 라우터
router.use('/token', require('./token')); // 수동 갱신: POST /api/cafe24/token/refresh
router.use('/shop', require('./shop'));   // /test /products /product/:no /sync ...
router.use('/ops', require('./ops')); // GET /api/cafe24/ops/status?mall_id=...&shop_no=1
router.use('/orders', require('./orders'));


module.exports = router;
