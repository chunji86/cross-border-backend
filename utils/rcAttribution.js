// utils/rcAttribution.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data'); // 예: Render 환경변수
const RC_DIR = path.join(DATA_DIR, 'rc');

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function storePath(mallId, shopNo) { return path.join(RC_DIR, `${mallId}-${shopNo}.json`); }

async function loadEvents(mallId, shopNo) {
  ensureDir(RC_DIR);
  const p = storePath(mallId, shopNo);
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const arr = JSON.parse(raw);
    // 7일 이전 데이터는 버리기
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    return Array.isArray(arr) ? arr.filter(e => (e?.ts ?? 0) >= cutoff) : [];
  } catch { return []; }
}

async function saveAll(mallId, shopNo, list) {
  ensureDir(RC_DIR);
  fs.writeFileSync(storePath(mallId, shopNo), JSON.stringify(list, null, 2));
}

async function saveEvent(evt) {
  const list = await loadEvents(evt.mallId, String(evt.shopNo));
  list.push(evt);
  await saveAll(evt.mallId, String(evt.shopNo), list);
}

function toDate(x) {
  try { return new Date(x); } catch { return new Date(); }
}

/**
 * 주문 배열에 rc 자동 부착.
 * @param {string} mallId
 * @param {number|string} shopNo
 * @param {Array<object>} orders  // Cafe24 원본 주문 배열 (API 응답 아이템)
 * @returns {Promise<Array<object>>} rc가 반영된 주문 배열(원본과 동일 키, rc만 추가)
 */
async function attachRcBulk(mallId, shopNo, orders) {
  const events = await loadEvents(mallId, String(shopNo));
  if (!orders?.length || !events.length) return orders;

  const WINDOW_MIN = 30;

  const byTime = [...events].sort((a, b) => (b.ts - a.ts)); // 최신 우선
  const out = [];

  for (const c of orders) {
    // Cafe24 주문키 추정(몰마다 key 이름 상이)
    const orderNo = String(c.order_id || c.order_no || c.orderNo || c.orderId || '');
    const orderedAt = toDate(c.ordered_at || c.created_at || c.order_date || c.orderDate || Date.now());
    const from = orderedAt.getTime() - WINDOW_MIN * 60 * 1000;
    const to = orderedAt.getTime() + 5 * 60 * 1000;

    let rc = c.rc || null;
    if (!rc) {
      // 1) orderNoHint 가장 먼저
      let cand = byTime.find(e =>
        !e.matched &&
        e.mallId === mallId &&
        String(e.shopNo) === String(shopNo) &&
        e.rc &&
        (e.orderNoHint && String(e.orderNoHint) === orderNo) &&
        e.ts >= from && e.ts <= to
      );

      // 2) 없다면 order_result/checkout 근접 이벤트
      if (!cand) {
        cand = byTime.find(e =>
          !e.matched &&
          e.mallId === mallId &&
          String(e.shopNo) === String(shopNo) &&
          e.rc &&
          (e.event === 'order_result' || e.event === 'checkout') &&
          e.ts >= from && e.ts <= to
        );
      }

      if (cand) {
        rc = cand.rc;
        cand.matched = true; // 메모리상 갱신
      }
    }

    // rc를 필드로 추가(원본 구조 유지)
    out.push({ ...c, rc });
  }

  // matched 플래그 반영 저장
  await saveAll(mallId, String(shopNo), byTime);
  return out;
}

module.exports = {
  saveEvent,
  attachRcBulk,
};
