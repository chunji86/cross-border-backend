const express = require('express');
const router = express.Router();
const rewards = require('../../utils/rewardStore');
const { listOrders } = require('../../utils/orderStore');

// 내 주문(판매) 목록: confirmed=1(구매확정)만 보면 확정 리워드만
router.get('/orders', (req, res) => {
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  const influencer_id = req.query.influencer_id;
  if (!mall_id || !influencer_id) return res.status(400).json({ error: 'mall_id & influencer_id required' });

  const confirmed = req.query.confirmed === '1' ? true : (req.query.confirmed === '0' ? false : null);
  const orders = listOrders(mall_id, shop_no, { confirmed, influencer_id });
  return res.json({ ok: true, count: orders.length, orders });
});

// 내 리워드 요약(확정/대기)
router.get('/rewards/summary', (req, res) => {
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  const influencer_id = req.query.influencer_id;
  if (!mall_id || !influencer_id) return res.status(400).json({ error: 'mall_id & influencer_id required' });

  const cfg = rewards.getConfig(mall_id, shop_no);
  const orders = listOrders(mall_id, shop_no, { confirmed: null, influencer_id });

  let pending = 0, confirmed = 0;
  for (const o of orders) {
    for (const it of o.items || []) {
      // 해당 아이템이 이 인플루언서 판매인지: orderStore가 rc→influencer 매핑으로 필터해줍니다.
      const rate = rewards.resolveRate(cfg, influencer_id, it.product_no);
      const amount = (Number(it.price) || 0) * (Number(it.qty) || 0);
      const reward = amount * rate;
      if (o.purchaseconfirmation_date) confirmed += reward; else pending += reward;
    }
  }
  return res.json({
    ok: true,
    influencer_id,
    currency: 'KRW',
    pending: Math.round(pending),
    confirmed: Math.round(confirmed)
  });
});

module.exports = router;
