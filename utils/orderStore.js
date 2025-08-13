// utils/orderStore.js
const fs = require('fs');
const path = require('path');
const { tokenPath } = require('./tokenManager'); // DATA_DIR 판별 재사용

function dataDirFor(mall_id, shop_no) {
  const base = path.dirname(tokenPath(mall_id, shop_no)); // .../data/{mall_id}
  const dir = path.join(base, `orders_${shop_no}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function storePath(mall_id, shop_no) {
  return path.join(dataDirFor(mall_id, shop_no), 'orders.json');
}

// 주문 정규화 (필드명이 몰/버전마다 조금씩 달라 안전하게 매핑)
function normalize(order) {
  const o = order || {};
  const items = o.items || o.order_items || o.products || [];
  return {
    order_no: o.order_no || o.order_id || o.id || null,
    order_date: o.order_date || o.created_date || o.created_at || null,
    pay_date: o.pay_date || o.payment_date || null,
    shipbegin_date: o.shipbegin_date || o.shipping_begin_date || o.ship_begin_date || null,
    shipend_date: o.shipend_date || o.shipping_end_date || o.ship_end_date || null,
    purchaseconfirmation_date: o.purchaseconfirmation_date || o.purchase_confirmation_date || null,
    shipping_status: o.shipping_status || o.delivery_status || null,
    order_status: o.order_status || o.status || null,
    total_price: Number(o.total_price ?? o.payment_amount ?? 0),
    buyer_id: o.member_id || o.buyer_id || null,
    receiver: o.receiver || null,
    items: items.map(it => ({
      product_no: it.product_no || it.product_id || null,
      variant_code: it.variant_code || it.sku || null,
      qty: Number(it.quantity ?? it.qty ?? 0),
      price: Number(it.price ?? it.selling_price ?? 0),
      name: it.product_name || it.name || null
    })),
    raw: o
  };
}

// 파일 읽기/쓰기
function readAll(mall_id, shop_no) {
  try {
    const p = storePath(mall_id, shop_no);
    if (!fs.existsSync(p)) return { rows: [], map: {} };
    const json = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const rows = Array.isArray(json?.rows) ? json.rows : [];
    const map = Object.create(null);
    for (const r of rows) map[r.order_no] = r;
    return { rows, map };
  } catch { return { rows: [], map: {} }; }
}
function writeAll(mall_id, shop_no, rows) {
  const p = storePath(mall_id, shop_no);
  fs.writeFileSync(p, JSON.stringify({ rows }, null, 2), 'utf-8');
}

// upsert
function upsertOrders(mall_id, shop_no, orders) {
  const { rows, map } = readAll(mall_id, shop_no);
  let changed = 0;
  for (const o of orders) {
    const n = normalize(o);
    if (!n.order_no) continue;
    if (!map[n.order_no]) { rows.push(n); map[n.order_no] = n; changed++; }
    else {
      // 업데이트: 최신 raw로 교체
      const idx = rows.findIndex(r => r.order_no === n.order_no);
      rows[idx] = n; map[n.order_no] = n; changed++;
    }
  }
  if (changed) writeAll(mall_id, shop_no, rows);
  return changed;
}

// 쿼리
function listOrders(mall_id, shop_no, { confirmed=null, status=null, influencer_id=null } = {}) {
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
  // influencer_id 필터는 Phase 2에서 링크/할당 매핑 후 적용
  return out;
}

module.exports = { upsertOrders, listOrders };
