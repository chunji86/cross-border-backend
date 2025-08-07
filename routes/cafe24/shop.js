// ✅ routes/cafe24/shop.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getToken } = require('../../utils/tokenManager');
const { CAFE24_MALL_ID } = process.env;

// ✅ 테스트용 라우터
router.get('/test', (req, res) => {
  res.send('✅ shop.js 라우터 연결 성공!');
});

// ✅ 카페24 상품 목록 조회
router.get('/products', async (req, res) => {
  const token = getToken();
  if (!token || !token.access_token) {
    return res.status(401).json({ error: 'Access token이 없습니다. 먼저 인증하세요.' });
  }

  try {
    const result = await axios.get(
      `https://${CAFE24_MALL_ID}.cafe24api.com/api/v2/admin/products`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    );

    res.json(result.data);
  } catch (err) {
    console.error('카페24 상품 조회 오류:', err.response?.data || err.message);
    res.status(500).json({ error: '카페24 상품 조회 실패' });
  }
});

module.exports = router;
