const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = 'j4fRwzq3XaAfOCes69FHIL';
const CLIENT_SECRET = 'aEjQ1oVRORfYFqGtKyH6FF';
const REDIRECT_URI = 'https://cross-border-backend-dc0m.onrender.com/api/cafe24/callback';

async function getAccessToken(mall_id, code) {
  const tokenUrl = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;

  try {
    const response = await axios.post(tokenUrl,
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokenData = response.data;

    const tokenPath = path.join(__dirname, `../tokens/${mall_id}_token.json`);
    fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
    console.log(`✅ [${mall_id}] 토큰 저장 완료`);
    return tokenData;
  } catch (error) {
    console.error(`❌ [${mall_id}] 토큰 요청 실패:`, error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getAccessToken };
