// utils/cafe24Token.js
const axios = require('axios');
const fs = require('fs');
const qs = require('querystring'); // 중요: form-urlencoded 인코딩

async function getAccessToken(code) {
  const {
    CAFE24_CLIENT_ID,
    CAFE24_CLIENT_SECRET,
    CAFE24_REDIRECT_URI,
    CAFE24_MALL_ID
  } = process.env;

  const tokenUrl = `https://${CAFE24_MALL_ID}.cafe24api.com/api/v2/oauth/token`;

  const data = qs.stringify({
    grant_type: 'authorization_code',
    code,
    client_id: CAFE24_CLIENT_ID,
    client_secret: CAFE24_CLIENT_SECRET,
    redirect_uri: CAFE24_REDIRECT_URI
  });

  try {
    const response = await axios.post(tokenUrl, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const token = response.data;
    fs.writeFileSync('cafe24_token.json', JSON.stringify(token, null, 2));
    return token;
  } catch (error) {
    console.error('❌ 카페24 토큰 요청 실패:', error.response?.data || error.message);
    throw new Error('카페24 토큰 요청 실패');
  }
}

module.exports = {
  getAccessToken
};
