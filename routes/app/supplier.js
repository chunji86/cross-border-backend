const express = require('express');
const router = express.Router();
const rewards = require('../../utils/rewardStore');
const links = require('./links');
const { listOrders } = require('../../utils/orderStore');

// 전역/개별 리워드율 설정 조회
router.get('/rewards/config', (req, res) => {
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
  return res.json(rewards.getConfig(mall_id, shop_no));
});

// 전역/개별 리워드율 설정 저장
router.put('/rewards/config', express.json(), (req, res) => {
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
  const saved = rewards.setConfig(mall_id, shop_no, req.body || {});
  return res.json({ ok: true, saved });
});

// 상품 ↔ 인플루언서 할당 + 개별율(선택)
router.post('/assign', express.json(), (req, res) => {
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
  const { product_no, influencer_id, enabled = true, commission_rate = null } = req.body || {};
  if (!product_no || !influencer_id) return res.status(400).json({ error: 'product_no & influencer_id required' });
  const saved = rewards.upsertAssignment(mall_id, shop_no, { product_no, influencer_id, enabled, commission_rate });
  return res.json({ ok: true, saved });
});

// 링크 생성 (코드 발급)
router.post('/link', express.json(), (req, res) => {
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
  const { product_no, influencer_id, campaign = null } = req.body || {};
  if (!product_no || !influencer_id) return res.status(400).json({ error: 'product_no & influencer_id required' });
  const code = links.createLink(mall_id, shop_no, { product_no, influencer_id, campaign });
  return res.json({ ok: true, code, link: `/api/app/go/${code}` });
});

// (참고) 간단 성과 요약(기간은 orders/sync로 먼저 적재한 후 사용)
router.get('/metrics', (req, res) => {
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  if (!mall_id) return res.status(400).json({ error: 'mall_id required' });
  const confirmed = req.query.confirmed === '1' ? true : null;
  const orders = listOrders(mall_id, shop_no, { confirmed });
  return res.json({ ok: true, count: orders.length, orders });
});

module.exports = router;
