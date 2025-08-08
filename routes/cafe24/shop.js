// routes/cafe24/shop.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getValidToken } = require('../../utils/tokenManager');

router.get('/products', async (req, res) => {
  const mall_id = req.query.mall_id;
  if (!mall_id) {
    return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
  }

  try {
    const access_token = await getValidToken(mall_id);
    const response = await axios.get(`https://${mall_id}.cafe24api.com/api/v2/admin/products`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error('❌ [shop.js] 상품 목록 조회 실패:', err.response?.data || err.message);
    res.status(500).json({ error: '상품 목록 조회 실패', details: err.response?.data || err.message });
  }
});

module.exports = router;
