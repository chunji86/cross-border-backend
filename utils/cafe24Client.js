// utils/cafe24Client.js (refreshAccessToken 함수만 교체)
const axios = require('axios');
const querystring = require('querystring');
const { loadToken, saveToken, isExpired } = require('./tokenManager');

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;

async function refreshAccessToken(mallId, refresh_token) {
  const url = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;

  const body = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: CAFE24_CLIENT_ID,
    client_secret: CAFE24_CLIENT_SECRET,
  });

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: 'Basic ' + Buffer.from(`${CAFE24_CLIENT_ID}:${CAFE24_CLIENT_SECRET}`).toString('base64'),
  };

  const resp = await axios.post(url, body, { headers });
  return resp.data; // 새 access_token(+ 새 refresh_token 가능) 반환
}


/**
 * mallId 기준으로 유효한 access_token을 확보한다.
 * - 만료(또는 안전 마진 임박) 시 refresh_token으로 자동 갱신
 * - 토큰 저장 파일 갱신
 * - 실패 시 에러 throw
 */
async function ensureAccessToken(mallId) {
  const token = loadToken(mallId);
  if (!token) {
    const e = new Error('토큰 파일이 존재하지 않습니다. 먼저 앱 설치/최초 발급을 완료하세요.');
    e.code = 'TOKEN_MISSING';
    throw e;
  }

  if (!isExpired(token)) {
    return token.access_token;
  }

  // 만료 또는 임박 → refresh
  if (!token.refresh_token) {
    const e = new Error('refresh_token이 없습니다. 재설치를 통해 토큰을 재발급하세요.');
    e.code = 'REFRESH_MISSING';
    throw e;
  }

  const refreshed = await refreshAccessToken(mallId, token.refresh_token);
  const saved = saveToken(mallId, refreshed);
  return saved.access_token;
}

/**
 * 공통 API 호출 헬퍼
 * path: "/api/v2/admin/products" 처럼 전달
 * method: GET/POST/PUT/DELETE
 * params/data: axios 옵션
 */
async function callCafe24(mallId, path, { method = 'GET', params = {}, data = {}, shopNo = DEFAULT_SHOP_NO } = {}) {
  const accessToken = await ensureAccessToken(mallId);
  const base = `https://${mallId}.cafe24api.com`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'X-Cafe24-Api-Version': CAFE24_API_VERSION,
    'X-Cafe24-Api-Access-Token-Type': 'user', // 대부분의 상점 API는 user 토큰
    'X-Cafe24-Shop-No': String(shopNo),
    'Content-Type': 'application/json',
  };

  const url = `${base}${path}`;

  const resp = await axios({
    url,
    method,
    headers,
    params,
    data,
  });

  return resp.data;
}

module.exports = {
  ensureAccessToken,
  callCafe24,
};
