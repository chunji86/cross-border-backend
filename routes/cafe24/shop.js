const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getValidAccessToken } = require('../../../utils/tokenManager');

// ✅ 상품 목록 조회 (자동 토큰 갱신 포함)
router.get('/products', async (req, res) => {
  const mall_id = req.query.mall_id;
  if (!mall_id) {
    return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
  }

  try {
    // 🔑 유효한 access_token 자동 획득 (만료 시 refresh)
    const access_token = await getValidAccessToken(mall_id);

    // ✅ 상품 목록 조회 API 호출
    const response = await axios.get(`https://${mall_id}.cafe24api.com/api/v2/admin/products`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ [shop.js] 상품 목록 조회 실패:', error.response?.data || error.message);
    res.status(500).json({
      error: '상품 목록 조회 실패',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
