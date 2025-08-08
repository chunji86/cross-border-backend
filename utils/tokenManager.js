// utils/tokenManager.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ✅ 토큰 파일 경로 생성
function getTokenFilePath(mall_id) {
  return path.join(__dirname, '..', 'tokens', `${mall_id}_token.json`);
}

// ✅ access_token 저장 함수
function saveAccessToken(mall_id, tokenData) {
  const tokenPath = getTokenFilePath(mall_id);

  const formattedToken = {
    ...tokenData,
    expires_at: Math.floor(new Date(tokenData.expires_at).getTime() / 1000),
    refresh_token_expires_at: Math.floor(new Date(tokenData.refresh_token_expires_at).getTime() / 1000),
    issued_at: tokenData.issued_at,
  };

  fs.writeFileSync(tokenPath, JSON.stringify(formattedToken, null, 2));
}

// ✅ access_token 유효성 검사 및 자동 갱신
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

  // 토큰 만료 → refresh 요청
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
  saveAccessToken,
};
