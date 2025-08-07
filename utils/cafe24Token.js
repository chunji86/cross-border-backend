// utils/cafe24Token.js
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, '../cafe24_token.json');

// 액세스 토큰 저장
function saveToken(tokenData) {
  fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
}

// 액세스 토큰 불러오기
function getToken() {
  if (!fs.existsSync(tokenPath)) return null;
  const data = fs.readFileSync(tokenPath);
  return JSON.parse(data);
}

module.exports = { saveToken, getToken };
