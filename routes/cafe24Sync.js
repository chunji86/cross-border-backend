const express = require('express');
const axios = require('axios');
const router = express.Router();

const { getToken } = require('../utils/cafe24Token');

// ✅ 카페24 상품 전체 목록 동기화 (백오피스용)
router.get('/products', async (req, res) => {
  try {
    const { access_token } = getToken();
    const { CAFE24_MALL_ID } = process.env;

    if (!access_token) {
      return res.status(401).json({ error: 'Access token이 없습니다. 먼저 인증을 완료해주세요.' });
    }

    const response = await axios.get(`https://${CAFE24_MALL_ID}.cafe24api.com/api/v2/admin/products`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ 카페24 상품 동기화 실패:', error.response?.data || error.message);
    res.status(500).json({ error: '카페24 상품 동기화 실패' });
  }
});

module.exports = router;
