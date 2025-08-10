// routes/cafe24/shop.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getValidAccessToken } = require('../../utils/tokenManager');

router.get('/products', async (req, res) => {
  try {
    const mallId = (req.query.mall_id || '').toString().trim();
    if (!mallId) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const accessToken = await getValidAccessToken(mallId); // ✅ DB에서 유효 토큰 확보
    const url = `https://${mallId}.cafe24api.com/api/v2/admin/products`;

    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 15000
    });

    res.json(data);
  } catch (err) {
    console.error('GET /products error:', err?.response?.data || err.message);
    res.status(500).json({ error: '상품 목록 조회 실패', details: err?.response?.data || err.message });
  }
});

module.exports = router;
