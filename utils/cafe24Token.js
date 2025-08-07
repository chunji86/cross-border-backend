// utils/cafe24Token.js
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, '../cafe24_token.json');

// ✅ 액세스 토큰 저장
function saveToken(tokenData) {
  fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
}

// ✅ 액세스 토큰 불러오기 (accessToken, mallId 추출해서 리턴)
function getCafe24Token() {
  try {
    if (!fs.existsSync(tokenPath)) return {};
    const data = fs.readFileSync(tokenPath, 'utf8');
    const tokenData = JSON.parse(data);
    return {
      accessToken: tokenData.access_token,
      mallId: tokenData.mall_id
    };
  } catch (error) {
    console.error('❌ cafe24_token.json 읽기 실패:', error.message);
    return {};
  }
}

module.exports = { saveToken, getCafe24Token };
