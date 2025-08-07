// routes/cafe24Token.js

const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

/**
 * 카페24 액세스 토큰 요청
 * @param {string} code - 인증 코드 (Authorization Code)
 * @returns {object} - 액세스 토큰 데이터
 */
async function getCafe24AccessToken(code) {
  const tokenUrl = `https://${process.env.CAFE24_MALL_ID}.cafe24api.com/api/v2/oauth/token`;

  const params = qs.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: process.env.CAFE24_REDIRECT_URI,
    client_id: process.env.CAFE24_CLIENT_ID,
    client_secret: process.env.CAFE24_CLIENT_SECRET
  });

  try {
    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    console.error('❌ 카페24 토큰 요청 실패:', error.response?.data || error.message);
    throw new Error('카페24 토큰 요청 실패');
  }
}

module.exports = { getCafe24AccessToken };
