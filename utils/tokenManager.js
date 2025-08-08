// utils/tokenManager.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

function getTokenFilePath(mall_id) {
  return path.join(__dirname, '..', 'tokens', `${mall_id}_token.json`);
}

// ✅ 토큰 유효성 검사 + 자동 갱신
async function getValidAccessToken(mall_id) {
  const tokenPath = getTokenFilePath(mall_id);

  if (!fs.existsSync(tokenPath)) {
    throw new Error('토큰 파일이 존재하지 않습니다.');
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  const now = Math.floor(Date.now() / 1000);

  if (now < tokenData.expires_at) {
    return tokenData.access_token;
  }

  // 만료된 경우, refresh
  try {
    const refreshResponse = await axios.post(
      `https://${mall_id}.cafe24api.com/api/v2/oauth/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: process.env.CAFE24_CLIENT_ID,
        client_secret: process.env.CAFE24_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const newTokenData = refreshResponse.data;
    const newExpiresAt = now + newTokenData.expires_in;

    const updatedToken = {
      ...tokenData,
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token || tokenData.refresh_token,
      expires_at: newExpiresAt,
    };

    fs.writeFileSync(tokenPath, JSON.stringify(updatedToken, null, 2));
    return updatedToken.access_token;
  } catch (err) {
    console.error('⚠️ 토큰 갱신 실패:', err.response?.data || err.message);
    throw new Error('토큰 갱신 실패');
  }
}

module.exports = {
  getValidAccessToken,
};
