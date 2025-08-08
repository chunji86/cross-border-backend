// utils/tokenManager.js
const fs = require('fs');
const path = require('path');

// tokens 디렉토리 경로 설정
const tokensDir = path.join(__dirname, '..', 'tokens');

// 디렉토리가 없으면 생성
if (!fs.existsSync(tokensDir)) {
  fs.mkdirSync(tokensDir);
}

// access_token 저장 함수
const saveAccessToken = (mall_id, tokenData) => {
  const tokenPath = path.join(tokensDir, `${mall_id}_token.json`);
  fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
  console.log(`✅ [5] access_token 저장 완료: ${tokenPath}`);
};

module.exports = {
  saveAccessToken,
};
