// utils/tokenManager.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const TOKEN_DIR = path.join(__dirname, '../tokens');
if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR);

function getTokenFilePath(mall_id) {
  return path.join(TOKEN_DIR, `${mall_id}_token.json`);
}

function saveAccessToken(mall_id, tokenData) {
  const filePath = getTokenFilePath(mall_id);
  fs.writeFileSync(filePath, JSON.stringify(tokenData, null, 2));
  console.log(`✅ [tokenManager] 토큰 저장 완료: ${filePath}`);
}

function loadAccessToken(mall_id) {
  const filePath = getTokenFilePath(mall_id);
  if (!fs.existsSync(filePath)) return null;
  const tokenData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return tokenData;
}

function isTokenExpired(tokenData) {
  const now = new Date();
  const expiry = new Date(tokenData.expires_at);
  return now >= expiry;
}

async function refreshAccessToken(mall_id) {
  const tokenData = loadAccessToken(mall_id);
  if (!tokenData) throw new Error(`❌ [tokenManager] 토큰 데이터 없음`);

  try {
    const response = await axios.post(
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

    const newToken = response.data;
    newToken.mall_id = mall_id; // mall_id 저장
    saveAccessToken(mall_id, newToken);
    console.log(`♻️ [tokenManager] 토큰 자동 갱신 완료`);
    return newToken;
  } catch (err) {
    console.error('❌ [tokenManager] 토큰 갱신 실패:', err.response?.data || err.message);
    throw err;
  }
}

async function getValidAccessToken(mall_id) {
  let tokenData = loadAccessToken(mall_id);
  if (!tokenData) throw new Error('❌ 토큰 파일이 존재하지 않습니다');

  if (isTokenExpired(tokenData)) {
    console.log('⚠️ access_token 만료됨. refresh_token으로 갱신 시도...');
    tokenData = await refreshAccessToken(mall_id);
  }

  return tokenData.access_token;
}

module.exports = {
  saveAccessToken,
  loadAccessToken,
  getValidAccessToken,   // ✅ 자동 갱신 포함된 access_token 요청
};
