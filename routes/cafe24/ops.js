// routes/cafe24/ops.js
const express = require('express');
const router = express.Router();
const { loadToken, tokenPath } = require('../../utils/tokenManager');
const fs = require('fs');

const WRITE_ENABLED = process.env.WRITE_ENABLED === '1'; // 쓰기(가격/재고 수정) 노출 여부

router.get('/status', (req, res) => {
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

  const t = loadToken(mall_id, shop_no);
  if (!t) return res.json({ ok: false, mall_id, shop_no, has_token: false });

  const leftMs = new Date(t.expires_at).getTime() - Date.now();
  let filePath; try { filePath = tokenPath(mall_id, shop_no); } catch {}
  const fileExists = filePath ? fs.existsSync(filePath) : false;

  res.json({
    ok: true,
    mall_id, shop_no,
    has_token: true,
    expires_at: t.expires_at,
    seconds_left: Math.max(0, Math.floor(leftMs / 1000)),
    file: { path: filePath || null, exists: fileExists },
    issued_at: t.issued_at || null,
    write_enabled: WRITE_ENABLED
  });
});

// 단일 HTML 대시보드
router.get('/dashboard', (req, res) => {
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cafe24 Ops Dashboard</title>
<style>
  :root { --bd:#e5e7eb; --muted:#6b7280; }
  body { font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,'Noto Sans KR',Arial; margin:16px; }
  h1 { margin: 0 0 12px; }
  .row { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  input, button, select { padding:8px 10px; font-size:14px; }
  button { cursor:pointer; }
  .card { border:1px solid var(--bd); border-radius:12px; padding:16px; margin:12px 0; box-shadow:0 1px 2px rgba(0,0,0,.04); }
  .muted { color:var(--muted); font-size:12px; }
  .grid { display:grid; gap:10px; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); }
  table { width:100%; border-collapse:collapse; }
  th, td { border-bottom:1px solid var(--bd); padding:8px; text-align:left; font-size:13px; }
  tr:hover { background:#f8fafc; }
  .pill { display:inline-block; padding:2px 8px; border-radius:999px; border:1px solid var(--bd); font-size:12px; }
  .warn { color:#b45309; }
  .ok { color:#047857; }
  pre { background:#0b1020; color:#e5e7eb; padding:12px; border-radius:8px; white-space:pre-wrap; max-height:420px; overflow:auto;}
  .tabs { display:flex; gap:6px; margin-top:12px; }
  .tab { padding:8px 12px; border:1px solid var(--bd); border-bottom:none; border-radius:12px 12px 0 0; background:#f9fafb; cursor:pointer; }
  .tab.active { background:white; font-weight:600; }
  .panel { border:1px solid var(--bd); border-radius:0 12px 12px 12px; padding:12px; }
  .hidden { display:none; }
  .danger { background:#fee2e2; border:1px solid #fecaca; padding:8px; border-radius:8px; }
</style>
</head>
<body>
  <h1>Cafe24 운영 대시보드</h1>

  <div class="card">
    <div class="row">
      <label>mall_id</label><input id="mall" placeholder="hanfen" value="${(process.env.ALLOWED_MALL_IDS||'').split(',')[0]||''}">
      <label>shop_no</label><input id="shop" type="number" value="1" min="1" style="width:80px">
      <button id="btnStatus">상태 조회</button>
      <button id="btnRefresh">토큰 강제 갱신</button>
      <button id="btnSyncInc">증분 동기화</button>
      <button id="btnSyncFull">전체 동기화</button>
      <span id="statusPill" class="pill">-</span>
    </div>
    <div class="muted">팁: 먼저 상태 조회로 토큰 남은 시간 확인 → 필요 시 강제 갱신</div>
  </div>

  <div class="tabs">
    <div class="tab active" data-tab="products">상품</div>
    <div class="tab" data-tab="detail">상세/옵션/재고</div>
    <div class="tab" data-tab="logs">Raw 응답</div>
  </div>

  <div class="panel">
    <div id="panel-products">
      <div class="row">
        <label>limit</label><input id="limit" type="number" value="100" min="1" max="100" style="width:90px">
        <label>page</label><input id="page" type="number" value="1" min="1" style="width:90px">
        <button id="btnList">상품 목록 조회</button>
      </div>
      <table id="tbl">
        <thead><tr><th>product_no</th><th>code</th><th>name</th><th>price</th><th>action</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>

    <div id="panel-detail" class="hidden">
      <div class="row">
        <label>product_no</label><input id="prod" type="number" placeholder="예: 45" style="width:120px">
        <button id="btnLean">상세+옵션+재고(lean)</button>
      </div>
      <div id="detailBox" class="card"></div>

      <div id="writeBox" class="card ${WRITE_ENABLED ? '' : 'hidden'}">
        <h3>쓰기(공급사 전용) — 현재: ${WRITE_ENABLED ? '<span class="ok">활성</span>' : '<span class="warn">비활성</span>'}</h3>
        <div class="danger ${WRITE_ENABLED ? 'hidden' : ''}">서버 env에 WRITE_ENABLED=1 설정해야 버튼이 보입니다. (기능은 나중에 붙여도 UI는 여기서 테스트 가능)</div>
        <div class="grid">
          <div>
            <h4>재고 조정(variant)</h4>
            <input id="variantCode" placeholder="variant_code (목록에서 복사)">
            <select id="invOp">
              <option value="add">가감(add)</option>
              <option value="set">절대설정(set)</option>
            </select>
            <input id="invQty" type="number" placeholder="수량" style="width:120px">
            <button id="btnAdj" ${WRITE_ENABLED ? '' : 'disabled'}>실행</button>
          </div>
          <div>
            <h4>가격 수정(product)</h4>
            <input id="price" type="number" placeholder="판매가(원)" style="width:160px">
            <button id="btnPrice" ${WRITE_ENABLED ? '' : 'disabled'}>실행</button>
          </div>
        </div>
      </div>
    </div>

    <div id="panel-logs" class="hidden">
      <pre id="out">{}</pre>
      <div class="muted">엔드포인트: <span id="ep"></span></div>
    </div>
  </div>

<script>
const $ = id => document.getElementById(id);
const showLog = (ep, data) => { $('ep').textContent = ep; $('out').textContent = JSON.stringify(data, null, 2); };
const pill = (text, ok) => { const el = $('statusPill'); el.textContent = text; el.style.color = ok ? '#047857' : '#b45309'; };

document.querySelectorAll('.tab').forEach(t=>{
  t.onclick = ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('#panel-products,#panel-detail,#panel-logs').forEach(x=>x.classList.add('hidden'));
    t.classList.add('active');
    $('panel-'+t.dataset.tab).classList.remove('hidden');
  };
});

// 상태/토큰/동기화
$('btnStatus').onclick = async () => {
  const ep = \`/api/cafe24/ops/status?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`;
  const r = await fetch(ep); const j = await r.json(); showLog(ep, j);
  if (j.ok) pill(\`만료까지 \${j.seconds_left}s\`, true);
  else pill('토큰 없음', false);
};
$('btnRefresh').onclick = async () => {
  const ep = \`/api/cafe24/token/refresh?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`;
  const r = await fetch(ep, { method:'POST' }); const j = await r.json(); showLog(ep, j);
  pill('갱신 요청됨', !!j.ok);
};
$('btnSyncInc').onclick = async () => {
  const ep = \`/api/cafe24/shop/sync?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}&limit=100\`;
  const r = await fetch(ep); const j = await r.json(); showLog(ep, j);
};
$('btnSyncFull').onclick = async () => {
  const ep = \`/api/cafe24/shop/sync?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}&mode=full&limit=100\`;
  const r = await fetch(ep); const j = await r.json(); showLog(ep, j);
};

// 상품 목록
$('btnList').onclick = async () => {
  const ep = \`/api/cafe24/shop/products?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}&limit=\${$('limit').value}&page=\${$('page').value}\`;
  const r = await fetch(ep); const j = await r.json(); showLog(ep, j);
  const tbody = $('tbl').querySelector('tbody'); tbody.innerHTML = '';
  (j.data?.products||[]).forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = \`<td>\${p.product_no}</td><td>\${p.product_code||''}</td><td>\${p.product_name||p.name||''}</td><td>\${p.price||''}</td>
                    <td><button data-no="\${p.product_no}" class="go">상세</button></td>\`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('button.go').forEach(b=>{
    b.onclick = ()=>{ $('prod').value = b.dataset.no; document.querySelector('[data-tab="detail"]').click(); $('btnLean').click(); };
  });
};

// 상세 lean
$('btnLean').onclick = async () => {
  const ep = \`/api/cafe24/shop/product/\${$('prod').value}/lean?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`;
  const r = await fetch(ep); const j = await r.json(); showLog(ep, j);
  const d = $('detailBox');
  if (!j.ok) { d.innerHTML = '<div class="danger">조회 실패</div>'; return; }
  const head = \`<div><b>\${j.product?.product_no}</b> \${j.product?.name||''} <span class="muted">(\${j.counts?.variants||0} variants)</span></div>\`;
  const rows = (j.variants||[]).map(v=>\`
    <tr>
      <td><code>\${v.variant_code||''}</code></td>
      <td>\${(v.options||[]).join(' / ')}</td>
      <td>\${v.sku||''}</td>
      <td style="text-align:right">\${v.price?.toLocaleString?.() ?? v.price}</td>
      <td style="text-align:right">\${v.inventory_total}</td>
    </tr>\`).join('');
  d.innerHTML = head + \`
    <table style="margin-top:8px">
      <thead><tr><th>variant_code</th><th>options</th><th>sku</th><th>price</th><th>inventory</th></tr></thead>
      <tbody>\${rows}</tbody>
    </table>\`;
};

// (선택) 쓰기 버튼: 서버가 아직 막혀있으면 405/403이 떨어집니다.
$('btnAdj')?.addEventListener('click', async ()=>{
  const mall = $('mall').value, shop=$('shop').value, v=$('variantCode').value, op=$('invOp').value, qty=$('invQty').value;
  const ep = \`/api/cafe24/shop/variant/\${encodeURIComponent(v)}/inventory/adjust?mall_id=\${mall}&shop_no=\${shop}\`;
  const r = await fetch(ep, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ op, qty: Number(qty) }) });
  const j = await r.json(); showLog(ep, j);
});
$('btnPrice')?.addEventListener('click', async ()=>{
  const mall = $('mall').value, shop=$('shop').value, prod=$('prod').value, price=$('price').value;
  const ep = \`/api/cafe24/shop/product/\${prod}/price?mall_id=\${mall}&shop_no=\${shop}\`;
  const r = await fetch(ep, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ selling_price: Number(price) }) });
  const j = await r.json(); showLog(ep, j);
});
</script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;
