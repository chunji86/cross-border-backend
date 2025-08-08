// routes/cafe24/shop.js

const express = require('express');
const router = express.Router();
const axios = require('axios');

// ✅ 상품 목록 조회 API
// GET /api/cafe24/shop/products?mall_id=hanfen
router.get('/products', async (req, res) => {
  const { mall_id } = req.query;

  if (!mall_id) {
    return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
  }

  try {
    // ✅ 자동 갱신 포함된 access_token 가져오기
    const accessToken = await getValidAccessToken(mall_id);

    // ✅ Cafe24 상품 목록 조회 요청
    const response = await axios.get(`https://${mall_id}.cafe24api.com/api/v2/admin/products`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ 상품 목록 조회 실패:', error.response?.data || error.message);
    res.status(500).json({
      error: '상품 목록 조회 실패',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
