// routes/cafe24/orders.js
const express = require('express');
const router = express.Router();
const { callCafe24 } = require('../../utils/cafe24Client');
const { upsertOrders, listOrders } = require('../../utils/orderStore');
const { attachRcBulk } = require('../../utils/rcAttribution'); // ✅ 추가

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
      const params = {
        limit, page,
        // created 기준
        start_date: start, end_date: end,
        // updated 기준(몰/버전 편차 대응)
        created_start_date: start, created_end_date: end,
      };

      const data = await callCafe24(mall_id, '/api/v2/admin/orders', {
        method: 'GET', params, shopNo: shop_no
      });

      let orders = Array.isArray(data?.orders) ? data.orders : [];
      if (!orders.length) break;

      // ✅ 여기서 rc 자동 매칭을 적용한 뒤 저장한다
      orders = await attachRcBulk(mall_id, shop_no, orders);

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
// 파일 상단에 유틸 추가
function sumQty(items = []) {
  return items.reduce((a, it) => a + Number(it.quantity || it.qty || 0), 0);
}
function pickRepName(items = []) {
  const it = items[0];
  return (
    it?.product_name || it?.name || it?.productName || '-'  // 대표상품명
  );
}
function calcAmount(order = {}) {
  // 결제금액 후보(몰 버전/결제상태에 따라 다름)
  return Number(
      order.pay_amount ??
      order.order_price?.payment_amount ??
      order.order_price?.total_amount ??
      order.total_price ??
      order.payment_amount ??
      0
  ) || 0;
}
function calcStatus(order = {}) {
  // 아주 단순 표시: 배송시작일 있으면 배송중/완료, 아니면 미발송
  if (order.shipbegin_date || order.shipping_begin_date) return '배송중/완료';
  return '미발송';
}
function shapeForDashboard(order) {
  const items = order.items || order.products || order.orderItems || [];
  return {
    order_no: order.order_no || order.orderNo || order.order_id || order.orderId,
    rep_name: pickRepName(items),     // 대표상품
    qty: sumQty(items),               // 수량합
    amount: calcAmount(order),        // 결제금액(미결제면 0)
    influencer: order.rc || order.influencer_id || '—',   // 인플루언서(매칭된 rc)
    ship_status: calcStatus(order),   // 배송/확정 상태 요약
  };
}


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
     // ✅ 대시보드 표시용 필드 추가
    const display = list.map(shapeForDashboard);

    return res.json({
      ok: true,
      mall_id,
      shop_no,
      count: list.length,
      orders: list,          // 원본(그대로 유지)
      display_orders: display // ← 대시보드가 이걸 쓰도록 바꾸면 표가 채워집니다
    });
    return res.json({ ok: true, mall_id, shop_no, count: list.length, orders: list });
  } catch (err) {
    return res.status(500).json({ error: '주문 목록 조회 실패', detail: err.message });
  }
});

module.exports = router;
