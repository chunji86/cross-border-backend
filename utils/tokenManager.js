const fs = require('fs');
const path = require('path');

// tokens/ 폴더 절대 경로 설정
const tokensDir = path.resolve(__dirname, '../tokens');

// tokens 폴더가 없으면 생성
if (!fs.existsSync(tokensDir)) {
  fs.mkdirSync(tokensDir, { recursive: true });
  console.log('📁 tokens 디렉토리 생성 완료');
}

// ✅ 토큰 저장 함수
function saveAccessToken(mall_id, tokenData) {
  return new Promise((resolve, reject) => {
    try {
      const filePath = path.join(tokensDir, `${mall_id}_token.json`);
      fs.writeFileSync(filePath, JSON.stringify(tokenData, null, 2), 'utf-8');
      console.log(`✅ [tokenManager] 토큰 저장 완료: ${filePath}`);
      resolve(true);
    } catch (error) {
      console.error('❌ [tokenManager] 토큰 저장 실패:', error);
      reject(error);
    }
  });
}

// ✅ 토큰 불러오기 함수
function loadAccessToken(mall_id) {
  try {
    const filePath = path.join(tokensDir, `${mall_id}_token.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ [tokenManager] 토큰 파일이 존재하지 않습니다: ${mall_id}_token.json`);
      return null;
    }
    const tokenData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(tokenData);
  } catch (error) {
    console.error('❌ [tokenManager] 토큰 로드 실패:', error);
    return null;
  }
}

module.exports = {
  saveAccessToken,
  loadAccessToken,
};
