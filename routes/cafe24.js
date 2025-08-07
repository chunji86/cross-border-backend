const express = require('express');
const axios = require('axios');
const router = express.Router();

const { saveToken: saveCafe24Token } = require('../utils/cafe24Token');
const { saveToken: saveLocalToken } = require('../utils/tokenManager');

const {
  CAFE24_CLIENT_ID,
  CAFE24_CLIENT_SECRET,
  CAFE24_REDIRECT_URI,
  CAFE24_MALL_ID,
} = process.env;

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
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

    console.log('✅ Access Token:', access_token);

    // ✅ 토큰 저장 (카페24 + 로컬 모두)
    saveCafe24Token({ access_token, refresh_token, expires_at });
    saveLocalToken({ access_token, refresh_token, expires_at });

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
