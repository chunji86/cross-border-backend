// routes/cafe24/ops.js
const express = require('express');
const router = express.Router();
const { loadToken, tokenPath } = require('../../utils/tokenManager');
const fs = require('fs');

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
  });
});

// 간단 운영 대시보드 (HTML)
router.get('/dashboard', (req, res) => {
  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Cafe24 Ops Dashboard</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', Arial; margin: 20px; }
    .row { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
    input, button, select { padding:8px 10px; font-size:14px; }
    button { cursor:pointer; }
    .card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin:10px 0; box-shadow:0 1px 2px rgba(0,0,0,.04); }
    .muted { color:#6b7280; font-size:12px; }
    pre { background:#0b1020; color:#e5e7eb; padding:12px; border-radius:8px; white-space:pre-wrap; max-height:420px; overflow:auto;}
    h2 { margin:0 0 8px; }
  </style>
</head>
<body>
  <h1>Cafe24 운영 대시보드</h1>
  <div class="row">
    <label>mall_id</label><input id="mall" placeholder="hanfen" value="${(process.env.ALLOWED_MALL_IDS||'').split(',')[0]||''}">
    <label>shop_no</label><input id="shop" type="number" value="1" min="1" style="width:80px">
    <button id="btnStatus">상태 조회</button>
    <button id="btnRefresh">토큰 강제 갱신</button>
    <button id="btnSyncInc">증분 동기화</button>
    <button id="btnSyncFull">전체 동기화</button>
  </div>

  <div class="card">
    <h2>Quick Actions</h2>
    <div class="row">
      <label>product_no</label><input id="prod" type="number" placeholder="예: 100" style="width:120px">
      <button id="btnProd">상품 상세</button>
      <button id="btnVar">옵션(variants)</button>
      <button id="btnInv">재고(inventories)</button>
      <input id="variant" placeholder="variant_code (예: P0000A-000A)">
      <button id="btnEmbed">상세+옵션+재고(embed)</button>
    </div>
  </div>

  <div class="card">
    <h2>응답</h2>
    <pre id="out">{}</pre>
    <div class="muted">엔드포인트: <span id="ep"></span></div>
  </div>

  <script>
    const $ = id => document.getElementById(id);
    const show = (ep, data) => { $('ep').textContent = ep; $('out').textContent = JSON.stringify(data, null, 2); };
    async function j(ep, method='GET'){
      const r = await fetch(ep, { method, headers: { 'Content-Type':'application/json' }});
      const t = await r.json().catch(()=>({ status:r.status, text:'<no-json>' }));
      show(ep, t);
    }

    $('btnStatus').onclick = ()=> j(\`/api/cafe24/ops/status?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`);
    $('btnRefresh').onclick = ()=> j(\`/api/cafe24/token/refresh?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`, 'POST');
    $('btnSyncInc').onclick = ()=> j(\`/api/cafe24/shop/sync?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}&limit=100\`);
    $('btnSyncFull').onclick = ()=> j(\`/api/cafe24/shop/sync?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}&mode=full&limit=100\`);

    $('btnProd').onclick = ()=> j(\`/api/cafe24/shop/product/\${$('prod').value}?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`);
    $('btnVar').onclick  = ()=> j(\`/api/cafe24/shop/product/\${$('prod').value}/variants?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`);
    $('btnInv').onclick  = ()=> j(\`/api/cafe24/shop/product/\${$('prod').value}/variants/\${encodeURIComponent($('variant').value)}/inventories?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`);
    $('btnEmbed').onclick= ()=> j(\`/api/cafe24/shop/product/\${$('prod').value}/with?mall_id=\${$('mall').value}&shop_no=\${$('shop').value}\`);
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;
