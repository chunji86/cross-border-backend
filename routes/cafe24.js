// routes/cafe24.js
const express = require('express');
const axios = require('axios');
const qs = require('qs');
const router = express.Router();
const { saveAccessToken } = require('../utils/tokenManager');

const CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;
const REDIRECT_URI = process.env.CAFE24_REDIRECT_URI;

// ✅ 앱 설치 완료 후 Callback URL 처리
router.get('/callback', async (req, res) => {
  const { code, mall_id, state } = req.query;

  console.log('✅ [1] /callback 진입:', req.query);

  if (!code || !mall_id) {
    console.error('❌ [2] code 없음 - 토큰 요청 불가');
    return res.status(400).send('Missing authorization code.');
  }

  try {
    console.log('🔄 [3] 토큰 요청 전송 중...');

    const tokenResponse = await axios.post(
      `https://${mall_id}.cafe24api.com/api/v2/oauth/token`,
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokenData = tokenResponse.data;
    console.log('✅ [4] 토큰 응답 수신:', tokenData);

    // ✅ access_token 저장
    saveAccessToken(mall_id, tokenData);

    return res.send('🎉 라쿤글로벌 카페24 앱이 정상 작동 중입니다!');
  } catch (error) {
    console.error('❌ [ERROR] Callback 처리 중 오류:', error.response?.data || error.message);
    return res.status(500).send('토큰 발급 실패');
  }
});

module.exports = router;
