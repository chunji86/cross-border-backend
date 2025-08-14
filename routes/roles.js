const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getUser, setUser, listUsers } = require('../utils/roleStore');

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session';

function readSession(req) {
  const t = req.cookies?.cb_session;
  if (!t) return null;
  try { return jwt.verify(t, SESSION_SECRET); } catch { return null; }
}
function requireLogin(req, res, next) {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'login required' });
  req.sess = s;
  next();
}

// [고객] 역할 신청
// POST /api/roles/apply { type: 'influencer' | 'supplier' }
router.post('/apply', requireLogin, (req, res) => {
  const { type } = req.body || {};
  if (!['influencer', 'supplier'].includes(type)) {
    return res.status(400).json({ error: 'invalid type' });
  }
  const { mall_id, shop_no, customer_id } = req.sess;
  const now = new Date().toISOString();
  const cur = getUser(mall_id, shop_no, customer_id);

  if (cur?.status === 'approved' && cur?.role === type) {
    return res.json({ ok: true, already: true, user: cur });
  }

  const user = setUser(mall_id, shop_no, customer_id, {
    role: type, status: 'pending', applied_at: now
  });
  res.json({ ok: true, user });
});

// [고객] 내 상태 확인 + 내 rc(승인 시)
// GET /api/roles/me
router.get('/me', requireLogin, (req, res) => {
  const { mall_id, shop_no, customer_id } = req.sess;
  const user = getUser(mall_id, shop_no, customer_id) || { status: 'none' };
  res.json({ ok: true, mall_id, shop_no, customer_id, user });
});

// [고객] 내 공유링크(인플루언서 승인 시 제공)
// GET /api/roles/my-share-link?product_no=45&path=/product/테스트/45/
router.get('/my-share-link', requireLogin, (req, res) => {
  const { mall_id, shop_no, customer_id } = req.sess;
  const u = getUser(mall_id, shop_no, customer_id);
  if (!u || u.role !== 'influencer' || u.status !== 'approved') {
    return res.status(403).json({ error: 'not approved influencer' });
  }
  const rc = u.influencer_code; // 승인 시 부여됨
  // 프런트가 실제 상품 경로(path)나 product_no를 넘겨주면 그대로 사용
  const path = req.query.path || '/';
  const origin = `https://${mall_id}.cafe24.com`;
  const url = `${origin}${path}${path.includes('?') ? '&' : '?'}rc=${encodeURIComponent(rc)}`;
  res.json({ ok: true, url, rc });
});

// [관리자] 신청 목록/승인/거절
router.get('/admin/list', (req, res) => {
  const { mall_id, shop_no } = req.query;
  const { role, status } = req.query;
  if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
  const items = listUsers(mall_id, shop_no || '1', { role, status });
  res.json({ ok: true, items });
});

router.post('/admin/approve', (req, res) => {
  const { mall_id, shop_no = '1', customer_id, role } = req.body || {};
  if (!mall_id || !customer_id || !role) return res.status(400).json({ error: 'missing params' });
  const now = new Date().toISOString();
  let payload = { role, status: 'approved', approved_at: now };
  if (role === 'influencer') {
    payload.influencer_code = `inf-${customer_id}`; // rc = inf-{고객ID}
  }
  const user = setUser(mall_id, shop_no, customer_id, payload);
  res.json({ ok: true, user });
});

router.post('/admin/reject', (req, res) => {
  const { mall_id, shop_no = '1', customer_id, role } = req.body || {};
  if (!mall_id || !customer_id || !role) return res.status(400).json({ error: 'missing params' });
  const now = new Date().toISOString();
  const user = setUser(mall_id, shop_no, customer_id, { role, status: 'rejected', rejected_at: now });
  res.json({ ok: true, user });
});

module.exports = router;
