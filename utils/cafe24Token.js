const axios = require('axios');
const qs = require('qs');

/**
 * 카페24 액세스 토큰 요청
 * @param {Object} params
 * @param {string} params.mall_id - 예: yourmall.cafe24.com 의 yourmall
 * @param {string} params.client_id
 * @param {string} params.client_secret
 * @param {string} params.code - OAuth 인증 후 전달된 code
 * @param {string} params.redirect_uri - 앱 등록 시 설정한 redirect URI
 * @returns {Promise<Object>} - access_token, refresh_token 등 포함
 */
async function getCafe24Token({ mall_id, client_id, client_secret, code, redirect_uri }) {
  try {
    const tokenUrl = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;

    const data = qs.stringify({
      grant_type: 'authorization_code',
      code,
      client_id,
      client_secret,
      redirect_uri,
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await axios.post(tokenUrl, data, { headers });

    console.log('✅ 카페24 토큰 요청 성공');
    return response.data;
  } catch (error) {
    console.error('❌ 카페24 토큰 요청 실패:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getCafe24Token };
