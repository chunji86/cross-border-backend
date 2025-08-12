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

module.exports = router;
