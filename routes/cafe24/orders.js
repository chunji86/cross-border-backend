// routes/cafe24/orders.js
const express = require('express');
const router = express.Router();
const { callCafe24 } = require('../../utils/cafe24Client');
const { upsertOrders, listOrders } = require('../../utils/orderStore');

// 날짜 헬퍼
function iso(d){ return new Date(d).toISOString().slice(0,10); }

// [1] 주문 동기화 (폴링형)
// 예) /api/cafe24/orders/sync?mall_id=hanfen&shop_no=1&start=2025-08-01&end=2025-08-13
router.get('/sync', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    // 기간 기본값: 최근 7일
    const end = req.query.end || iso(Date.now());
    const start = req.query.start || iso(Date.now() - 6*24*3600*1000);

    let page = Math.max(1, Number(req.query.page || 1));
    const limit = 100; // 카페24 주문 API 한도 내
    const maxPages = 100;

    let totalFetched = 0;
    while (page <= maxPages) {
      // 버전/몰마다 파라미터 키가 다를 수 있어 유연하게: created/updated 기준 병행
      const params = {
        limit, page,
        // created 기준
        start_date: start, end_date: end,
        // updated 기준 (일부 몰에서 이 키를 사용)
        created_start_date: start, created_end_date: end,
      };

      const data = await callCafe24(mall_id, '/api/v2/admin/orders', {
        method: 'GET', params, shopNo: shop_no
      });

      const orders = Array.isArray(data?.orders) ? data.orders : [];
      if (!orders.length) break;

      // 정규화 & 적재
      upsertOrders(mall_id, shop_no, orders);
      totalFetched += orders.length;

      if (orders.length < limit) break;
      page++;
    }

    return res.json({ ok: true, mall_id, shop_no, start, end, fetched: totalFetched });
  } catch (err) {
    return res.status(500).json({ error: '주문 동기화 실패', detail: err.data || err.response?.data || err.message });
  }
});

// [2] 주문 목록 조회(공급사/인플루언서 공용)
// 예) /api/cafe24/orders/list?mall_id=hanfen&shop_no=1&confirmed=1&status=shipping_end
router.get('/list', (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const confirmed = req.query.confirmed === '1' ? true
                     : req.query.confirmed === '0' ? false : null;
    const status = req.query.status || null; // 예: shipping_begin / shipping_end / purchase_confirm
    const influencer_id = req.query.influencer_id || null; // (V2) 링크 매핑 후 필터링에 사용

    const list = listOrders(mall_id, shop_no, { confirmed, status, influencer_id });
    return res.json({ ok: true, mall_id, shop_no, count: list.length, orders: list });
  } catch (err) {
    return res.status(500).json({ error: '주문 목록 조회 실패', detail: err.message });
  }
});

module.exports = router;
