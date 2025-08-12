// utils/tokenManager.js
const fs = require('fs');
const path = require('path');

const TOKENS_DIR = path.join(process.cwd(), 'tokens');
if (!fs.existsSync(TOKENS_DIR)) fs.mkdirSync(TOKENS_DIR, { recursive: true });

function tokenFile(mallId) {
  return path.join(TOKENS_DIR, `${mallId}_token.json`);
}

function loadToken(mallId) {
  try {
    const p = tokenFile(mallId);
    if (!fs.existsSync(p)) return null;
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return raw;
  } catch {
    return null;
  }
}

function saveToken(mallId, tokenObj) {
  const p = tokenFile(mallId);
  // expires_in이 null이면 2시간(7200초)로 기본값 설정
  const issuedAt = new Date();
  const expiresInSec = Number(tokenObj.expires_in || 7200);
  const expiresAt = new Date(issuedAt.getTime() + expiresInSec * 1000).toISOString();

  const normalized = {
    ...tokenObj,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt,
  };

  fs.writeFileSync(p, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

function isExpired(tokenObj, safetySeconds = 60) {
  if (!tokenObj || !tokenObj.expires_at) return true;
  const now = new Date();
  const expiresAt = new Date(tokenObj.expires_at);
  // 안전 마진(safetySeconds) 전에 갱신
  return now.getTime() >= (expiresAt.getTime() - safetySeconds * 1000);
}

module.exports = {
  loadToken,
  saveToken,
  isExpired,
};
