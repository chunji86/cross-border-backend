// routes/cafe24/index.js
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const router = express.Router();
const { saveToken } = require('../../utils/tokenManager');

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI;
const DEFAULT_SCOPE = process.env.CAFE24_SCOPE || 'mall.read_product mall.write_product';

// 핑 (마운트 확인용)
router.get('/', (req, res) => res.json({ ok: true, where: '/api/cafe24' }));

// 설치 시작
router.get('/start', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).send('mall_id 파라미터가 필요합니다.');
    if (!CAFE24_CLIENT_ID || !CAFE24_CLIENT_SECRET || !CAFE24_REDIRECT_URI) {
      return res.status(500).send('환경변수(CAFE24_CLIENT_ID/SECRET/REDIRECT_URI)를 확인하세요.');
    }
    const state = `${mall_id}:${shop_no}:${Date.now()}`;
    const base = `https://${mall_id}.cafe24api.com`;
    const authUrl = `${base}/api/v2/oauth/authorize?` + querystring.stringify({
      response_type: 'code',
      client_id: CAFE24_CLIENT_ID,
      redirect_uri: CAFE24_REDIRECT_URI,
      scope: DEFAULT_SCOPE,
      state,
      shop_no: shop_no,
    });
    return res.redirect(authUrl);
  } catch (e) {
    console.error('[/api/cafe24/start] error:', e.message);
    return res.status(500).send('설치 시작 실패');
  }
});

// 콜백 (토큰 교환)
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send('code/state가 없습니다.');
    const [mall_id] = String(state).split(':');
    const tokenUrl = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;
    const body = querystring.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CAFE24_REDIRECT_URI,
      client_id: CAFE24_CLIENT_ID,
      client_secret: CAFE24_CLIENT_SECRET,
    });
    const resp = await axios.post(tokenUrl, body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const saved = saveToken(mall_id, resp.data);
    return res.json({ ok: true, mall_id, token_saved: true, expires_in: saved.expires_in ?? null });
  } catch (e) {
    console.error('[/api/cafe24/callback] error:', e.response?.data || e.message);
    return res.status(500).json({ error: '카페24 토큰 요청 실패', detail: e.response?.data || e.message });
  }
});

// /shop 하위 라우터
router.use('/shop', require('./shop'));
module.exports = router;
