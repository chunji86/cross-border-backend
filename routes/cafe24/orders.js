// routes/cafe24/orders.js
const express = require('express');
const router = express.Router();

const { callCafe24 } = require('../../utils/cafe24Client');
const { upsertOrders, listOrders } = require('../../utils/orderStore');
const { attachRcBulk } = require('../../utils/rcAttribution');

// ------- 표시용 유틸 -------
function sumQty(items = []) {
  return items.reduce((a, it) => a + Number(it.quantity || it.qty || 0), 0);
}
function pickRepName(items = []) {
  const it = items[0];
  return it?.product_name || it?.name || it?.productName || '-';
}
function calcAmount(order = {}) {
  const raw = order._raw_amounts || {};
  return Number(
    order.pay_amount ??
    raw.pay_amount ??
    order.order_price?.payment_amount ??
    raw.payment_amount ??
    order.order_price?.total_amount ??
    raw.total_amount ??
    order.total_price ??
    order.settle_price ??
    raw.settle_price ??
    0
  ) || 0;
}
function calcShip(order = {}) {
  if (order.shipbegin_date || order.shipping_begin_date) return '배송중/완료';
  return '미발송';
}
function shapeForDashboard(order) {
  const items = order.items || order.products || order.orderItems || [];
  return {
    order_no: order.order_no || order.orderNo || order.order_id || order.orderId,
    rep_name: pickRepName(items),
    qty: sumQty(items),
    amount: calcAmount(order),
    influencer: order.rc || order.influencer_id || '—',
    ship_status: calcShip(order),
  };
}

// ------- 품목 조회 (카페24 표준) -------
async function fetchOrderItems(mallId, shopNo, orderId) {
  // GET /api/v2/admin/orders/{order_id}/products
  const data = await callCafe24(mallId, `/api/v2/admin/orders/${orderId}/products`, {
    method: 'GET', shopNo
  });
  const products = Array.isArray(data?.products) ? data.products : [];
  return products.map(p => ({
    product_no: p.product_no ?? p.productNo ?? null,
    product_name: p.product_name ?? p.productName ?? '-',
    quantity: Number(p.quantity ?? p.qty ?? 0),
    price: Number(p.payment_price ?? p.price ?? p.supply_price ?? 0),
  }));
}

// ------- 날짜 헬퍼 -------
function iso(d) { return new Date(d).toISOString().slice(0, 10); }

// [1] 주문 동기화
// 예) /api/cafe24/orders/sync?mall_id=hanfen&shop_no=1&start=2025-08-14&end=2025-08-14
router.get('/sync', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const end = req.query.end || iso(Date.now());
    const start = req.query.start || iso(Date.now() - 6 * 24 * 3600 * 1000);

    let page = Math.max(1, Number(req.query.page || 1));
    const limit = 100;
    const maxPages = 100;

    let totalFetched = 0;

    while (page <= maxPages) {
      const params = {
        limit, page,
        start_date: start, end_date: end,
        created_start_date: start, created_end_date: end,
      };

      const data = await callCafe24(mall_id, '/api/v2/admin/orders', {
        method: 'GET', params, shopNo: shop_no
      });

      let orders = Array.isArray(data?.orders) ? data.orders : [];
      if (!orders.length) break;

      // 🔹 rc 자동 매칭을 먼저 적용 (시간대 기반)
      orders = await attachRcBulk(mall_id, shop_no, orders);

      // 🔹 각 주문의 품목까지 끌어와서 채움
      for (const o of orders) {
        const orderId = String(o.order_id || o.order_no || o.orderNo || o.orderId || '');
        try {
          const items = await fetchOrderItems(mall_id, shop_no, orderId);
          o.items = items;
        } catch (_) {
          o.items = o.items || [];
        }
        // 금액 후보도 함께 저장해 두면 표시가 쉬워짐
        o._raw_amounts = {
          pay_amount: o.pay_amount,
          total_amount: o.order_price?.total_amount,
          payment_amount: o.order_price?.payment_amount,
          settle_price: o.settle_price,
        };
      }

      // 🔹 저장
      upsertOrders(mall_id, shop_no, orders);
      totalFetched += orders.length;

      if (orders.length < limit) break;
      page++;
    }

    res.json({ ok: true, mall_id, shop_no, start, end, fetched: totalFetched });
  } catch (err) {
    res.status(500).json({ error: '주문 동기화 실패', detail: err.response?.data || err.data || err.message });
  }
});

// [2] 주문 목록 조회 (대시보드용 파생 필드 포함)
router.get('/list', (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const confirmed = req.query.confirmed === '1' ? true
                     : req.query.confirmed === '0' ? false : null;
    const status = req.query.status || null;
    const influencer_id = req.query.influencer_id || null;

    const list = listOrders(mall_id, shop_no, { confirmed, status, influencer_id });

    const display = list.map(shapeForDashboard);
    res.json({
      ok: true,
      mall_id,
      shop_no,
      count: list.length,
      orders: list,             // 원본
      display_orders: display   // 대시보드 표시용
    });
  } catch (err) {
    res.status(500).json({ error: '주문 목록 조회 실패', detail: err.message });
  }
});

module.exports = router;
