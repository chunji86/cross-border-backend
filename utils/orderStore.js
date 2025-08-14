// utils/orderStore.js (final)
const fs = require('fs');
const path = require('path');
const { tokenPath } = require('./tokenManager');
const { getLinkByCode, rebuildCache } = require('./linkStore');

// ---------------- paths ----------------
function dataDirFor(mall_id, shop_no) {
  const base = path.dirname(tokenPath(mall_id, shop_no)); // .../data/{mall_id}
  const dir = path.join(base, `orders_${shop_no}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function storePath(mall_id, shop_no) {
  return path.join(dataDirFor(mall_id, shop_no), 'orders.json');
}

// ---------------- helpers ----------------
function extractRc(raw) {
  const s = JSON.stringify(raw || {});
  const m = s.match(/[?&]rc=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// 카페24/내부 포맷 섞여 들어와도 공통 스키마로 정규화
function normalize(src) {
  const o = src || {};
  // 품목 원본 키를 최대한 흡수
  const rawItems = o.items || o.order_items || o.products || o.orderItems || [];
  // 금액 후보들(표시 계산을 위해 저장)
  const rawAmounts = o._raw_amounts || {
    pay_amount: o.pay_amount,
    total_amount: o.order_price?.total_amount,
    payment_amount: o.order_price?.payment_amount,
    settle_price: o.settle_price,
  };

  const n = {
    // 기본 키들
    order_no: o.order_no || o.order_id || o.id || o.orderNo || o.orderId || null,
    order_date: o.order_date || o.ordered_at || o.created_date || o.created_at || null,
    pay_date: o.pay_date || o.payment_date || null,

    // 배송/확정
    shipbegin_date: o.shipbegin_date || o.shipping_begin_date || o.ship_begin_date || null,
    shipend_date:   o.shipend_date   || o.shipping_end_date   || o.ship_end_date   || null,
    purchaseconfirmation_date: o.purchaseconfirmation_date || o.purchase_confirmation_date || null,

    // 상태/금액(백업용)
    shipping_status: o.shipping_status || o.delivery_status || null,
    order_status: o.order_status || o.status || null,
    total_price: Number(o.total_price ?? o.payment_amount ?? 0),

    // 구매자/추가
    buyer_id: o.member_id || o.buyer_id || null,

    // rc (원본 JSON/URL에서 추출)
    rc: o.rc ?? extractRc(o),

    // 품목 통일
    items: rawItems.map(it => ({
      product_no: it.product_no || it.product_id || it.productNo || null,
      variant_code: it.variant_code || it.sku || null,
      quantity: Number(it.quantity ?? it.qty ?? it.count ?? 0),
      price: Number(
        it.price ?? it.payment_price ?? it.selling_price ?? it.supply_price ?? 0
      ),
      product_name: it.product_name || it.name || it.productName || '-'
    })),

    // 금액 후보들 보존(표시 로직에서 활용)
    _raw_amounts: rawAmounts,

    // 원본 백업
    raw: o
  };

  return n;
}

// ---------------- storage core ----------------
function readAll(mall_id, shop_no) {
  try {
    const p = storePath(mall_id, shop_no);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8')) || { rows: [] };
  } catch {}
  return { rows: [] };
}
function writeAll(mall_id, shop_no, rows) {
  const p = storePath(mall_id, shop_no);
  fs.writeFileSync(p, JSON.stringify({ rows }, null, 2), 'utf-8');
}

/**
 * upsertOrders
 * - 동일 order_no 기준으로 업서트
 * - 새로 들어온 데이터에 items/rc/_raw_amounts가 없으면 기존 값을 보존
 * - rc → influencer_id 매핑 수행
 */
function upsertOrders(mall_id, shop_no, orders = []) {
  try { rebuildCache(mall_id, shop_no); } catch {}

  const data = readAll(mall_id, shop_no);
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const byNo = new Map(rows.map(r => [String(r.order_no), r]));

  let changed = 0;

  for (const src of orders) {
    const n = normalize(src);
    if (!n.order_no) continue;

    // rc → influencer 매핑
    let influencer_id = null;
    const rc = n.rc;
    if (rc) {
      const link = getLinkByCode(rc);
      if (link && String(link.mall_id) === String(mall_id) && Number(link.shop_no) === Number(shop_no)) {
        influencer_id = link.influencer_id;
      }
    }

    const prev = byNo.get(String(n.order_no));

    const merged = {
      ...(prev || {}),
      ...(n || {}),
      // 보존 규칙: 새 값이 비면 이전 값을 유지
      items: (n.items && n.items.length > 0) ? n.items : (prev?.items || []),
      rc: n.rc ?? prev?.rc ?? null,
      influencer_id: influencer_id ?? prev?.influencer_id ?? null,
      _raw_amounts: { ...(prev?._raw_amounts || {}), ...(n._raw_amounts || {}) }
    };

    byNo.set(String(n.order_no), merged);

    if (!prev) {
      rows.push(merged);
      changed++;
    } else {
      const idx = rows.findIndex(r => r.order_no === n.order_no);
      rows[idx] = merged;
      changed++;
    }
  }

  if (changed) writeAll(mall_id, shop_no, Array.from(byNo.values()));
  return changed;
}

/**
 * listOrders
 * - confirmed/status/influencer_id 필터링
 * - 최신 주문 우선 정렬
 */
function listOrders(mall_id, shop_no, { confirmed = null, status = null, influencer_id = null } = {}) {
  const { rows } = readAll(mall_id, shop_no);
  let out = rows;

  if (confirmed !== null) {
    out = out.filter(r => confirmed ? !!r.purchaseconfirmation_date : !r.purchaseconfirmation_date);
  }
  if (status) {
    out = out.filter(r =>
      (r.shipping_status && r.shipping_status.includes(status)) ||
      (r.order_status && r.order_status.includes(status)) ||
      (status === 'shipping_begin' && r.shipbegin_date) ||
      (status === 'shipping_end' && r.shipend_date) ||
      (status === 'purchase_confirm' && r.purchaseconfirmation_date)
    );
  }
  if (influencer_id) {
    out = out.filter(r => r.influencer_id === influencer_id);
  }

  return out.sort((a, b) => {
    const ta = new Date(a.order_date || a.ordered_at || 0).getTime();
    const tb = new Date(b.order_date || b.ordered_at || 0).getTime();
    return tb - ta; // 최신 우선
  });
}

module.exports = { upsertOrders, listOrders };
