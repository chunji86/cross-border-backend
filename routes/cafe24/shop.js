const express = require('express');
const axios = require('axios');
const router = express.Router();
const tokenManager = require('../../utils/tokenManager');

// ✅ GET /api/cafe24/shop/products - 카페24 상품 목록 가져오기
router.get('/products', async (req, res) => {
  const mall_id = 'hanfen';

  try {
    const tokenData = await tokenManager.getAccessToken(mall_id);
    const accessToken = tokenData.access_token;

    const response = await axios.get(`https://${mall_id}.cafe24api.com/api/v2/admin/products`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ [ERROR] 상품 목록 조회 실패:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: '상품 목록 조회 실패' });
    }
  }
});

module.exports = router;
