// utils/tokenManager.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function tokenPath(mallId, shopNo = 1) {
  const dir = path.join(DATA_DIR, mallId);
  ensureDir(dir);
  return path.join(dir, `${shopNo}.json`);
}

function loadToken(mallId, shopNo = 1) {
  try {
    const p = tokenPath(mallId, shopNo);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

// expires_at 5분 전부터 만료로 간주
function isExpired(tokenObj, safetySeconds = 300) {
  if (!tokenObj || !tokenObj.expires_at) return true;
  const now = Date.now();
  const exp = new Date(tokenObj.expires_at).getTime();
  return now >= exp - safetySeconds * 1000;
}

function saveToken(mallId, tokenObj, shopNo = 1) {
  const issuedAt = new Date();
  const expiresInSec = Number(tokenObj.expires_in || 7200); // 기본 2시간
  const expiresAt = new Date(issuedAt.getTime() + expiresInSec * 1000).toISOString();

  const normalized = {
    access_token: tokenObj.access_token,
    refresh_token: tokenObj.refresh_token,
    token_type: tokenObj.token_type || 'Bearer',
    scope: tokenObj.scope || null,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt,
    raw: tokenObj, // 원문(마스킹 필요 시 로그 금지)
  };

  fs.writeFileSync(tokenPath(mallId, shopNo), JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

module.exports = { loadToken, saveToken, isExpired, tokenPath };
