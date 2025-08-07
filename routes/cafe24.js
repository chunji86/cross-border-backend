// routes/cafe24.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// .env 파일에 저장된 앱 정보 사용
const {
  CAFE24_CLIENT_ID,
  CAFE24_CLIENT_SECRET,
  CAFE24_REDIRECT_URI,
  CAFE24_MALL_ID, // 예: racoonglobal.cafe24api.com 에서 'racoonglobal'
} = process.env;

// ✅ 카페24 OAuth 콜백 처리
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // ✅ Access Token 요청
    const tokenRes = await axios.post(`https://${CAFE24_MALL_ID}.cafe24api.com/api/v2/oauth/token`, null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: CAFE24_CLIENT_ID,
        client_secret: CAFE24_CLIENT_SECRET,
        redirect_uri: CAFE24_REDIRECT_URI,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, expires_at } = tokenRes.data;

    // ✅ 저장 or 테스트 응답
    console.log('Access Token:', access_token);
    res.json({
      message: '✅ 카페24 인증 성공!',
      access_token,
      refresh_token,
      expires_at,
    });
  } catch (error) {
    console.error('❌ 카페24 토큰 요청 실패:', error.response?.data || error.message);
    res.status(500).json({ error: '카페24 토큰 요청 실패' });
  }
});

module.exports = router;
