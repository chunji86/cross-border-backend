// utils/cafe24Client.js
const axios = require('axios');
const querystring = require('querystring');
const { loadToken, saveToken, isExpired } = require('./tokenManager');

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;

// ✅ 기본값 포함 (env 없더라도 동작)
const DEFAULT_API_VERSION = process.env.CAFE24_API_VERSION || '2024-12-01';
const DEFAULT_SHOP_NO    = Number(process.env.CAFE24_SHOP_NO || 1);

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
  return resp.data;
}

async function ensureAccessToken(mallId) {
  const token = loadToken(mallId);
  if (!token) {
    const e = new Error('토큰 파일이 존재하지 않습니다. 먼저 앱 설치/최초 발급을 완료하세요.');
    e.code = 'TOKEN_MISSING';
    throw e;
  }
  if (!isExpired(token)) return token.access_token;
  if (!token.refresh_token) {
    const e = new Error('refresh_token이 없습니다. 재설치로 재발급하세요.');
    e.code = 'REFRESH_MISSING';
    throw e;
  }
  const refreshed = await refreshAccessToken(mallId, token.refresh_token);
  const saved = saveToken(mallId, refreshed);
  return saved.access_token;
}

async function callCafe24(
  mallId,
  path,
  { method = 'GET', params = {}, data = {}, shopNo = DEFAULT_SHOP_NO, apiVersion = DEFAULT_API_VERSION } = {}
) {
  const accessToken = await ensureAccessToken(mallId);
  const base = `https://${mallId}.cafe24api.com`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'X-Cafe24-Api-Version': apiVersion,            // ✅ 항상 값 있음
    'X-Cafe24-Api-Access-Token-Type': 'user',
    'X-Cafe24-Shop-No': String(shopNo),
    'Content-Type': 'application/json',
  };
  const resp = await axios({ url: `${base}${path}`, method, headers, params, data });
  return resp.data;
}

module.exports = { ensureAccessToken, callCafe24 };
