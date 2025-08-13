// routes/jobs/index.js
const express = require('express');
const router = express.Router();
const { callCafe24 } = require('../../utils/cafe24Client');
const { upsertOrders } = require('../../utils/orderStore');

const CRON_SECRET = process.env.CRON_SECRET || '';

function iso(d){ return new Date(d).toISOString().slice(0,10); }
function requireAuth(req, res){
  if (!CRON_SECRET) return res.status(500).json({ error: 'CRON_SECRET not set' });
  const token = req.query.token || req.headers['x-cron-token'];
  if (token !== CRON_SECRET) return res.status(401).json({ error: 'unauthorized' });
}

async function syncRange(mall_id, shop_no, start, end){
  let page = 1, limit = 100, maxPages = 100;
  let total = 0;
  while (page <= maxPages) {
    const params = {
      limit, page,
      start_date: start, end_date: end,
      created_start_date: start, created_end_date: end,
    };
    const data = await callCafe24(mall_id, '/api/v2/admin/orders', {
      method: 'GET', params, shopNo: shop_no
    });
    const orders = Array.isArray(data?.orders) ? data.orders : [];
    if (!orders.length) break;
    upsertOrders(mall_id, shop_no, orders);
    total += orders.length;
    if (orders.length < limit) break;
    page++;
  }
  return total;
}

// 단일 몰/샵 동기화
router.get('/orders/sync', async (req, res) => {
  const auth = requireAuth(req, res); if (auth) return;
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
    const end = req.query.end || iso(Date.now());
    const start = req.query.start || iso(Date.now() - 6*24*3600*1000);
    const fetched = await syncRange(mall_id, shop_no, start, end);
    return res.json({ ok:true, mall_id, shop_no, start, end, fetched });
  } catch (err) {
    return res.status(500).json({ error:'cron sync failed', detail: err.data || err.response?.data || err.message });
  }
});

// 여러 몰/샵 일괄
// 예: JOB_TARGETS="hanfen:1;brand2:1"
router.get('/orders/sync-all', async (req, res) => {
  const auth = requireAuth(req, res); if (auth) return;
  try {
    const end = req.query.end || iso(Date.now());
    const start = req.query.start || iso(Date.now() - 6*24*3600*1000);
    const targets = (process.env.JOB_TARGETS || '').split(';').map(s=>s.trim()).filter(Boolean);
    if (!targets.length) return res.status(400).json({ error: 'JOB_TARGETS not set' });

    const results = [];
    for (const t of targets) {
      const [mall_id, shopStr] = t.split(':');
      const shop_no = Number(shopStr || 1);
      try {
        const fetched = await syncRange(mall_id, shop_no, start, end);
        results.push({ mall_id, shop_no, fetched, ok:true });
      } catch (e) {
        results.push({ mall_id, shop_no, ok:false, error: e.data || e.response?.data || e.message });
      }
    }
    return res.json({ ok:true, start, end, results });
  } catch (err) {
    return res.status(500).json({ error:'cron sync-all failed', detail: err.data || err.response?.data || err.message });
  }
});

module.exports = router;
