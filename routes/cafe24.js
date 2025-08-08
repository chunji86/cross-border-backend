const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
const path = require('path');
const { saveAccessToken } = require('../utils/tokenManager');

// [1] 앱 설치 완료 후 리디렉션될 콜백 URL
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const mall_id = req.query.mall_id || req.query.state; // mall_id가 없을 경우 state 사용
  const state = req.query.state;

  console.log('✅ [1] /callback 진입:', req.query);

  if (!code) {
    console.error('❌ [2] code 없음 - 토큰 요청 불가');
    return res.status(400).send('Missing authorization code.');
  }

  try {
    console.log('🔄 [3] 토큰 요청 전송 중...');

    const client_id = process.env.CAFE24_CLIENT_ID;
    const client_secret = process.env.CAFE24_CLIENT_SECRET;
    const redirect_uri = process.env.CAFE24_REDIRECT_URI;

    const tokenUrl = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;
    const tokenData = {
      grant_type: 'authorization_code',
      code,
      redirect_uri,
    };

    const tokenHeaders = {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const tokenResponse = await axios.post(tokenUrl, qs.stringify(tokenData), tokenHeaders);
    console.log('✅ [4] 토큰 응답 수신:', tokenResponse.data);

    // 저장
    await saveAccessToken(mall_id, tokenResponse.data);

    res.send('🎉 라쿤글로벌 카페24 앱이 정상 작동 중입니다!');
  } catch (error) {
    console.error('❌ [ERROR] Callback 처리 중 오류:', error.response?.data || error.message);
    res.status(500).send('앱 설치 중 오류가 발생했습니다.');
  }
});

module.exports = router;
