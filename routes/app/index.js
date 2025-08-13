// routes/app/index.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

const {
  getRewardConfig, setRewardConfig,
  listAssignments, upsertAssignment,
  createLink, listLinks, findLinkByCode,
  buildProductUrl,
} = require('../../utils/appStore');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// ─────────────────────────────────────────────
// 내부: 주문 저장 읽기 (jobs가 적재한 파일을 읽음)
// 경로는 utils/orderStore와 동일 규칙을 가정합니다.
async function readOrders(mall_id, shop_no) {
  const candidates = [
    path.join(DATA_DIR, 'orders', mall_id, `${shop_no}.json`),
    path.join(DATA_DIR, 'orders', `${mall_id}-${shop_no}.json`),
  ];
  for (const f of candidates) {
    try { return JSON.parse(await fs.readFile(f, 'utf8')); } catch {}
  }
  return []; // 저장 없으면 빈 배열
}

function isConfirmed(o) { return !!o.purchaseconfirmation_date; }
function sum(arr) { return arr.reduce((s, v) => s + (Number(v)||0), 0); }
function sumQty(items){ return (items||[]).reduce((s,it)=> s + (Number(it.qty)||0), 0); }

// ─────────────────────────────────────────────
// 공급사 API
// ─────────────────────────────────────────────
router.get('/supplier/rewards/config', async (req, res) => {
  try {
    const { mall_id, shop_no = 1 } = req.query;
    if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
    const cfg = await getRewardConfig(mall_id, shop_no);
    res.json(cfg);
  } catch (e) {
    res.status(500).json({ error: 'get reward config failed', detail: e.message });
  }
});

router.put('/supplier/rewards/config', async (req, res) => {
  try {
    const { mall_id, shop_no = 1 } = req.query;
    if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
    const saved = await setRewardConfig(mall_id, shop_no, req.body || {});
    res.json({ ok: true, saved });
  } catch (e) {
    res.status(500).json({ error: 'set reward config failed', detail: e.message });
  }
});

router.post('/supplier/assign', async (req, res) => {
  try {
    const { mall_id, shop_no = 1 } = req.query;
    if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
    const { product_no, influencer_id, enabled=true, commission_rate=null } = req.body || {};
    if (!product_no || !influencer_id) return res.status(400).json({ error: 'product_no & influencer_id required' });

    const row = await upsertAssignment(mall_id, shop_no, { product_no, influencer_id, enabled, commission_rate });
    res.json({ ok: true, assignment: row });
  } catch (e) {
    res.status(500).json({ error: 'assign failed', detail: e.message });
  }
});

router.post('/supplier/link', async (req, res) => {
  try {
    const { mall_id, shop_no = 1 } = req.query;
    const { product_no, influencer_id, campaign=null } = req.body || {};
    if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
    if (!product_no || !influencer_id) return res.status(400).json({ error: 'product_no & influencer_id required' });

    const row = await createLink(mall_id, shop_no, { product_no, influencer_id, campaign });
    res.json({ ok: true, code: row.code, link: `/api/app/go/${row.code}` });
  } catch (e) {
    res.status(500).json({ error: 'link create failed', detail: e.message });
  }
});

// (옵션) 목록 조회
router.get('/supplier/links', async (req, res) => {
  try {
    const { mall_id, shop_no = 1 } = req.query;
    if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
    const list = await listLinks(mall_id, shop_no);
    res.json({ ok: true, links: list });
  } catch (e) {
    res.status(500).json({ error: 'list links failed', detail: e.message });
  }
});

// ─────────────────────────────────────────────
// 인플루언서 API (읽기 전용)
// ─────────────────────────────────────────────
router.get('/influencer/orders', async (req, res) => {
  try {
    const { mall_id, shop_no = 1, influencer_id, confirmed } = req.query;
    if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
    if (!influencer_id) return res.status(400).json({ error: 'influencer_id required' });

    const all = await readOrders(mall_id, shop_no);

    // 주문 데이터 안에 influencer_id가 있을 때만 필터 (없다면 매칭 전 단계)
    let list = all.filter(o => (o.influencer_id || o.rc) === influencer_id);
    // 매칭 데이터가 아직 없으면 전체에서 rc/influencer_id가 없는 관계로 빈 배열일 수 있음(정상)
    if (confirmed === '1') list = list.filter(isConfirmed);
    if (confirmed === '0') list = list.filter(o => !isConfirmed(o));

    res.json({ ok: true, orders: list });
  } catch (e) {
    res.status(500).json({ error: 'influencer orders failed', detail: e.message });
  }
});

router.get('/influencer/rewards/summary', async (req, res) => {
  try {
    const { mall_id, shop_no = 1, influencer_id } = req.query;
    if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
    if (!influencer_id) return res.status(400).json({ error: 'influencer_id required' });

    const orders = (await readOrders(mall_id, shop_no))
      .filter(o => (o.influencer_id || o.rc) === influencer_id);

    // 리워드율: 인플루언서 개별율 > 전역 기본율
    const cfg = await getRewardConfig(mall_id, shop_no);
    const indiv = Number(cfg.influencers?.[influencer_id]);
    const baseRate = Number.isFinite(indiv) ? indiv : Number(cfg.default_rate || 0.10);

    const pending = orders.filter(o => !isConfirmed(o))
      .reduce((s, o) => s + (Number(o.total_price)||0) * baseRate, 0);
    const confirmed = orders.filter(isConfirmed)
      .reduce((s, o) => s + (Number(o.total_price)||0) * baseRate, 0);

    res.json({ ok: true, pending: Math.round(pending), confirmed: Math.round(confirmed), rate: baseRate });
  } catch (e) {
    res.status(500).json({ error: 'influencer summary failed', detail: e.message });
  }
});

// ─────────────────────────────────────────────
// 링크 리다이렉트: /api/app/go/:code → 상품 상세 + rc
// ─────────────────────────────────────────────
router.get('/go/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const hit = await findLinkByCode(code);
    if (!hit) return res.status(404).send('Not found');

    const url = buildProductUrl(hit.mall_id, hit.product_no, code);
    // 추후: 클릭 로그 저장 등도 여기에 추가 가능
    return res.redirect(302, url);
  } catch (e) {
    res.status(500).send('redirect failed');
  }
});

module.exports = router;
