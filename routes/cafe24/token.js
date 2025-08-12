// routes/cafe24/token.js
const express = require('express');
const router = express.Router();
const { loadToken, saveToken } = require('../../utils/tokenManager');
const { refreshAccessToken } = require('../../utils/cafe24Client');

router.post('/refresh', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const cur = loadToken(mall_id, shop_no);
    if (!cur?.refresh_token) return res.status(400).json({ error: 'refresh_token이 없습니다.' });

    const refreshed = await refreshAccessToken(mall_id, cur.refresh_token);
    const saved = saveToken(mall_id, refreshed, shop_no);
    res.json({ ok: true, mall_id, shop_no, refreshed: true, expires_at: saved.expires_at });
  } catch (err) {
    res.status(500).json({ error: '수동 갱신 실패', detail: err.response?.data || err.message });
  }
});

module.exports = router;
