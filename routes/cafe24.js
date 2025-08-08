const express = require('express');
const router = express.Router();
const { getAccessToken } = require('../utils/cafe24Token');
const { getToken } = require('../utils/tokenManager');
const axios = require('axios');

// ✅ 1. 앱 설치 콜백
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const mall_id = req.query.state;  // state를 mall_id로 사용

  if (!code || !mall_id) {
    return res.status(400).send('Missing code or mall_id');
  }

  try {
    const tokenData = await getAccessToken(mall_id, code);
    res.send(`<h2>✅ ${mall_id} 앱 설치 완료</h2><pre>${JSON.stringify(tokenData, null, 2)}</pre>`);
  } catch (err) {
    res.status(500).send('카페24 토큰 요청 실패');
  }
});

// ✅ 2. 저장된 토큰 보기
router.get('/token/:mall_id', (req, res) => {
  const mall_id = req.params.mall_id;
  const token = getToken(mall_id);
  if (!token) return res.status(404).json({ error: '토큰 없음' });

  res.json(token);
});

// ✅ 3. 상품 목록 API 테스트 (예시)
router.get('/shop/test', async (req, res) => {
  const mall_id = req.query.mall_id || 'hanfen';
  const token = getToken(mall_id);
  if (!token) return res.status(404).json({ error: '토큰 없음' });

  try {
    const apiUrl = `https://${mall_id}.cafe24api.com/api/v2/admin/products`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ 상품 목록 조회 실패:', error.response?.data || error.message);
    res.status(500).json({ error: 'API 호출 실패' });
  }
});

module.exports = router;
