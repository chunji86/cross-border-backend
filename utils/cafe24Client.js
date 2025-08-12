// utils/cafe24Client.js
const axios = require('axios');
const querystring = require('querystring');
const { loadToken, saveToken, isExpired } = require('./tokenManager');

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;

// 기본 API 버전(카페24 최신 기본값 기준) — env로 덮어쓸 수 있음
const DEFAULT_API_VERSION = process.env.CAFE24_API_VERSION || '2025-06-01';
const DEFAULT_SHOP_NO = Number(process.env.CAFE24_SHOP_NO || 1);

const http = axios.create({ timeout: 10_000 });

// ---------- helpers ----------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function shouldRetry(status) { return [429, 500, 502, 503, 504].includes(status); }
function backoffMs(attempt) { return Math.min(4000, (2 ** (attempt - 1)) * 1000) + Math.floor(Math.random() * 250); }
function parseRetryAfter(h) {
  const v = h?.['retry-after'] ?? h?.['Retry-After'];
  if (!v) return null;
  const n = Number(v);
  if (Number.isFinite(n)) return n * 1000;
  const d = new Date(v).getTime();
  return Number.isFinite(d) ? Math.max(0, d - Date.now()) : null;
}
function parseRateReset(h) {
  const cand = h?.['x-ratelimit-reset'] ?? h?.['X-RateLimit-Reset'] ?? h?.['x-rate-limit-reset'];
  if (!cand) return null;
  const n = Number(cand);
  if (!Number.isFinite(n)) return null;
  const ms = n < 10_000_000_000 ? n * 1000 : n; // sec or ms
  return Math.max(0, ms - Date.now());
}

// ---------- token refresh ----------
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
  return resp.data; // 새 access_token(+새 refresh_token 가능)
}

async function ensureAccessToken(mallId, shopNo = DEFAULT_SHOP_NO) {
  const token = loadToken(mallId, shopNo);
  if (!token) {
    const e = new Error('토큰 파일이 존재하지 않습니다. 먼저 앱 설치/최초 발급을 완료하세요.');
    e.code = 'TOKEN_MISSING';
    throw e;
  }
  // isExpired는 5분 마진(=300초)으로 만료 판단하도록 구성되어 있음
  if (!isExpired(token)) return token.access_token;

  if (!token.refresh_token) {
    const e = new Error('refresh_token이 없습니다. 재설치로 재발급하세요.');
    e.code = 'REFRESH_MISSING';
    throw e;
  }
  const refreshed = await refreshAccessToken(mallId, token.refresh_token);
  const saved = saveToken(mallId, refreshed, shopNo);
  return saved.access_token;
}

// ---------- core caller ----------
async function callCafe24(
  mallId,
  path,
  {
    method = 'GET',
    params = {},
    data = {},
    shopNo = DEFAULT_SHOP_NO,
    apiVersion = DEFAULT_API_VERSION,
    requestId,
  } = {}
) {
  const base = `https://${mallId}.cafe24api.com`;
  const started = Date.now();
  const BUDGET_MS = 60_000; // 전체 작업 타임박스 60s
  const traceId = requestId || Math.random().toString(36).slice(2, 10);

  const doCall = async (accessToken, version) => http({
    url: `${base}${path}`,
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Cafe24-Api-Version': version,
      'X-Cafe24-Api-Access-Token-Type': 'user',
      'X-Cafe24-Shop-No': String(shopNo),
      'X-Client-Request-Id': traceId, // 관측용
      'Content-Type': 'application/json',
    },
    params,
    data,
    validateStatus: () => true, // 수동 에러 처리
  });

  let accessToken = await ensureAccessToken(mallId, shopNo);

  // 1차 호출
  let resp = await doCall(accessToken, apiVersion);
  if (resp.status >= 200 && resp.status < 300) return resp.data;

  // 401 / invalid_token → 즉시 refresh 1회
  const bodyErr = resp.data?.error || resp.data?.error_description || resp.data?.message || '';
  if (resp.status === 401 || /invalid_token/i.test(bodyErr)) {
    const cur = loadToken(mallId, shopNo);
    if (!cur?.refresh_token) throw new Error('refresh_token 없음');
    const refreshed = await refreshAccessToken(mallId, cur.refresh_token);
    const saved = saveToken(mallId, refreshed, shopNo);
    accessToken = saved.access_token;
    resp = await doCall(accessToken, apiVersion);
    if (resp.status >= 200 && resp.status < 300) return resp.data;
  }

  // 요청한 버전이 불가 → 기본(2025-06-01)로 1회 폴백
  const vMsg = resp.data?.error?.message || bodyErr || '';
  if (resp.status === 400 && /version you requested is not available/i.test(vMsg)) {
    resp = await doCall(accessToken, '2025-06-01');
    if (resp.status >= 200 && resp.status < 300) return resp.data;
  }

  // 429/5xx 재시도(최대 3회). 헤더 기반 대기 우선
  let attempt = 1;
  while (shouldRetry(resp.status) && attempt <= 3 && (Date.now() - started) < BUDGET_MS) {
    const h = resp.headers || {};
    const hWait = parseRetryAfter(h) ?? parseRateReset(h);
    const wait = hWait ?? backoffMs(attempt);
    const until = Date.now() + wait;
    if (until - started > BUDGET_MS) break; // 타임박스 초과 방지

    await sleep(wait);
    resp = await doCall(accessToken, apiVersion);
    if (resp.status >= 200 && resp.status < 300) return resp.data;
    attempt++;
  }

  // 실패 → throw
  const err = new Error(resp.data?.error?.message || resp.statusText || 'Cafe24 API error');
  err.status = resp.status;
  err.data = resp.data;
  throw err;
}

module.exports = { ensureAccessToken, callCafe24, refreshAccessToken };
