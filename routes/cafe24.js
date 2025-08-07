const express = require('express');
const axios = require('axios');
const router = express.Router();
const { saveToken } = require('../utils/cafe24Token');
require('dotenv').config();

const {
  CAFE24_CLIENT_ID,
  CAFE24_CLIENT_SECRET,
  CAFE24_REDIRECT_URI,
  CAFE24_MALL_ID,
} = process.env;

// ✅ 카페24 인증 콜백
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const basicAuth = Buffer.from(`${CAFE24_CLIENT_ID}:${CAFE24_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      `https://${CAFE24_MALL_ID}.cafe24api.com/api/v2/oauth/token`,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: CAFE24_REDIRECT_URI,
      },
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const tokenData = response.data;
    saveToken(tokenData);

    res.send('✅ 토큰 저장 완료! 이제 API를 사용할 수 있습니다.');
  } catch (err) {
    console.error('❌ 카페24 토큰 요청 실패:', err.response?.data || err.message);
    res.status(500).json({ error: '카페24 토큰 요청 실패' });
  }
});

module.exports = router;
