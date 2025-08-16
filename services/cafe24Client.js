// services/cafe24Client.js
const fetch = require('node-fetch');

// TODO: 아래 두 함수는 이미 있으시면 기존 구현을 사용하세요.
async function getAccessToken(mall_id, shop_no) {
  // DATA_DIR 등에서 리프레시 토큰으로 access_token 갱신/로드
  // 반환 형태 예: { access_token: '...' }
  // 구현은 기존 프로젝트 로직에 맞춰 주세요.
  throw new Error('getAccessToken not implemented');
}

async function apiGet(mall_id, path, access_token) {
  const url = `https://${mall_id}.cafe24api.com${path}`;
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!r.ok) throw new Error(`cafe24_get_failed_${r.status}`);
  return r.json();
}

module.exports = { getAccessToken, apiGet };
