const fs = require('fs');
const path = require('path');

const saveAccessToken = async (mall_id, tokenData) => {
  try {
    const tokenDir = path.join(__dirname, '../tokens');
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir);
    }

    const tokenPath = path.join(tokenDir, `${mall_id}_token.json`);
    fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
    console.log(`✅ [TokenManager] 파일 저장 성공: ${tokenPath}`);
    return true;
  } catch (error) {
    console.error('❌ [TokenManager] 토큰 저장 실패:', error.message);
    return false;
  }
};

const getAccessToken = async (mall_id) => {
  try {
    const tokenPath = path.join(__dirname, '../tokens', `${mall_id}_token.json`);
    if (!fs.existsSync(tokenPath)) {
      throw new Error(`토큰 파일이 존재하지 않습니다: ${mall_id}_token.json`);
    }
    const token = fs.readFileSync(tokenPath, 'utf-8');
    return JSON.parse(token);
  } catch (error) {
    console.error('❌ [TokenManager] 토큰 읽기 오류:', error.message);
    throw error;
  }
};

module.exports = {
  saveAccessToken,
  getAccessToken,
};
