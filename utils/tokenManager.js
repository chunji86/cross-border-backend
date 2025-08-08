const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_DIR = path.join(__dirname, '..', 'tokens');

// 토큰 저장
function saveToken(mallId, tokenData) {
  try {
    if (!fs.existsSync(TOKEN_DIR)) {
      fs.mkdirSync(TOKEN_DIR);
    }

    const filePath = path.join(TOKEN_DIR, `${mallId}_token.json`);
    fs.writeFileSync(filePath, JSON.stringify(tokenData, null, 2));
    console.log(`✅ [토큰 저장 성공] ${filePath}`);
  } catch (error) {
    console.error('❌ [토큰 저장 실패]', error);
  }
}

// 토큰 불러오기
function loadToken(mallId) {
  try {
    const filePath = path.join(TOKEN_DIR, `${mallId}_token.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`토큰 파일이 존재하지 않습니다: ${mallId}_token.json`);
    }
    const raw = fs.readFileSync(filePath);
    return JSON.parse(raw);
  } catch (error) {
    console.error('❌ [토큰 불러오기 실패]', error.message);
    return null;
  }
}

// 카페24 토큰 요청 (Authorization 헤더 포함)
async function requestToken(code, mallId) {
  try {
    const basicAuth = Buffer.from(`${process.env.CAFE24_CLIENT_ID}:${process.env.CAFE24_CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(
      `https://${mallId}.cafe24api.com/api/v2/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.CAFE24_REDIRECT_URI
      }),
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const tokenData = response.data;
    saveToken(mallId, tokenData);
    return tokenData;

  } catch (error) {
    console.error('❌ [토큰 요청 실패]', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  saveToken,
  loadToken,
  requestToken
};
