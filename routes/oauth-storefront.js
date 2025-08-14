// routes/oauth-storefront.js
const express = require('express');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const router = express.Router();

const CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;
const REDIRECT_URI = process.env.CAFE24_STOREFRONT_REDIRECT_URI; // ex) https://your-backend/api/oauth/callback
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session';

function setSession(res, payload) {
  const token = jwt.sign(payload, SESSION_SECRET, { expiresIn: '7d' });
  res.cookie('cb_session', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 7*24*3600*1000 });
}
function readSession(req) {
  const t = req.cookies?.cb_session;
  if (!t) return null;
  try { return jwt.verify(t, SESSION_SECRET); } catch { return null; }
}

// 1) 로그인 시작
router.get('/login', (req, res) => {
  const { mall_id, shop_no = '1', redirect = '/public/roles/apply.html' } = req.query;
  if (!mall_id) return res.status(400).send('mall_id required');
  const state = Buffer.from(JSON.stringify({ mall_id, shop_no, redirect })).toString('base64url');
  const url =
    `https://${mall_id}.cafe24api.com/api/v2/oauth/authorize` +
    `?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent('customers')}` +
    `&state=${encodeURIComponent(state)}`;
  res.redirect(url);
});

// 2) 콜백: 토큰 교환 + 고객 본인 정보 조회 → 세션 발급
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('missing code/state');

  const { mall_id, shop_no = '1', redirect = '/public/roles/apply.html' } =
    JSON.parse(Buffer.from(String(state), 'base64url').toString('utf8'));

  const tokenResp = await fetch(`https://${mall_id}.cafe24api.com/api/v2/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });
  const token = await tokenResp.json();
  if (!token.access_token) return res.status(400).send('token exchange failed');

  const meResp = await fetch(`https://${mall_id}.cafe24api.com/api/v2/customers/me`, {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
  const me = await meResp.json();
  const customer = me?.customer;
  if (!customer?.member_id) return res.status(400).send('failed to fetch customer');

  setSession(res, { mall_id, shop_no, customer_id: String(customer.member_id) });
  res.redirect(redirect);
});

module.exports = router;
