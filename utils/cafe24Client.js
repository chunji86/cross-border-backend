// utils/cafe24Client.js
const axios = require('axios');
const querystring = require('querystring');
const { loadToken, saveToken, isExpired } = require('./tokenManager');

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;
const DEFAULT_API_VERSION = process.env.CAFE24_API_VERSION || '2025-06-01';
const DEFAULT_SHOP_NO = Number(process.env.CAFE24_SHOP_NO || 1);

const http = axios.create({ timeout: 10_000 });

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
  const resp = await http.post(url, body, { headers });
  return resp.data; // 새 access/refresh 반환 가능
}

async function ensureAccessToken(mallId, shopNo = DEFAULT_SHOP_NO) {
  const token = loadToken(mallId, shopNo);
  if (!token) {
    const e = new Error('토큰 파일이 존재하지 않습니다. 먼저 앱 설치/최초 발급을 완료하세요.');
    e.code = 'TOKEN_MISSING';
    throw e;
  }
  if (!isExpired(token)) return token.access_token; // 5분 마진

  // 만료 임박/만료 → refresh
  if (!token.refresh_token) {
    const e = new Error('refresh_token이 없습니다. 재설치로 재발급하세요.');
    e.code = 'REFRESH_MISSING';
    throw e;
  }
  const refreshed = await refreshAccessToken(mallId, token.refresh_token);
  const saved = saveToken(mallId, refreshed, shopNo);
  return saved.access_token;
}

async function callCafe24(
  mallId,
  path,
  { method = 'GET', params = {}, data = {}, shopNo = DEFAULT_SHOP_NO, apiVersion = DEFAULT_API_VERSION } = {}
) {
  const base = `https://${mallId}.cafe24api.com`;

  const doCall = async (accessToken, version) =>
    http({
      url: `${base}${path}`,
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Cafe24-Api-Version': version,
        'X-Cafe24-Api-Access-Token-Type': 'user',
        'X-Cafe24-Shop-No': String(shopNo),
        'Content-Type': 'application/json',
      },
      params,
      data,
    });

  // 1차 호출
  let accessToken = await ensureAccessToken(mallId, shopNo);
  try {
    const r = await doCall(accessToken, apiVersion);
    return r.data;
  } catch (e) {
    // 401/invalid_token → 즉시 갱신 후 1회 재시도
    const msg = e.response?.data?.error || e.response?.data?.error_description || e.message;
    if (e.response?.status === 401 || /invalid_token/i.test(msg)) {
      try {
        const current = loadToken(mallId, shopNo);
        if (!current?.refresh_token) throw e;
        const refreshed = await refreshAccessToken(mallId, current.refresh_token);
        const saved = saveToken(mallId, refreshed, shopNo);
        accessToken = saved.access_token;
        const r2 = await doCall(accessToken, apiVersion);
        return r2.data;
      } catch (e2) {
        throw e2;
      }
    }
    throw e;
  }
}

module.exports = { ensureAccessToken, callCafe24, refreshAccessToken };
