const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
const path = require('path');
const { saveAccessToken } = require('../utils/tokenManager');

router.get('/callback', async (req, res) => {
  try {
    console.log('✅ [1] /callback 진입:', req.query);

    const mall_id = req.query.mall_id || process.env.CAFE24_MALL_ID;
    const code = req.query.code;

    if (!code) {
      console.log('❌ [2] code 없음 - 토큰 요청 불가');
      return res.status(400).send('Missing authorization code.');
    }

    const tokenEndpoint = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;
    const client_id = process.env.CAFE24_CLIENT_ID;
    const client_secret = process.env.CAFE24_CLIENT_SECRET;
    const redirect_uri = process.env.CAFE24_REDIRECT_URI;

    const tokenPayload = qs.stringify({
      grant_type: 'authorization_code',
      code,
      client_id,
      client_secret,
      redirect_uri,
    });

    console.log('🔄 [3] 토큰 요청 전송 중...');
    const tokenResponse = await axios.post(tokenEndpoint, tokenPayload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('✅ [4] 토큰 응답 수신:', tokenResponse.data);

    // 저장 시도
    const tokenData = tokenResponse.data;
    const saveResult = await saveAccessToken(mall_id, tokenData);

    if (saveResult) {
      console.log(`✅ [5] 토큰 저장 성공: tokens/${mall_id}_token.json`);
    } else {
      console.log(`❌ [5] 토큰 저장 실패`);
    }

    res.send('🎉 라쿤글로벌 카페24 앱이 정상 작동 중입니다!');
  } catch (error) {
    console.error('❌ [ERROR] Callback 처리 중 오류:', error.response?.data || error.message);
    res.status(500).send('앱 설치 처리 중 오류가 발생했습니다.');
  }
});

module.exports = router;
