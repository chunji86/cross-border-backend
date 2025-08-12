// utils/tokenManager.js
const fs = require('fs');
const path = require('path'); // ✅ 먼저 선언해야 함

// DATA_DIR은 환경변수 또는 프로젝트 내 /data 사용
const DATA_DIR   = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const LEGACY_DIR = path.join(process.cwd(), 'tokens'); // 예전 파일 호환

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function tokenPath(mallId, shopNo = 1) {
  const dir = path.join(DATA_DIR, mallId);
  ensureDir(dir);
  return path.join(dir, `${shopNo}.json`);
}

function legacyPath(mallId) {
  return path.join(LEGACY_DIR, `${mallId}_token.json`);
}

// expires_at 5분(300s) 전부터 만료 간주
function isExpired(tokenObj, safetySeconds = 300) {
  if (!tokenObj || !tokenObj.expires_at) return true;
  const now = Date.now();
  const exp = new Date(tokenObj.expires_at).getTime();
  return now >= exp - safetySeconds * 1000;
}

function saveToken(mallId, tokenObj, shopNo = 1) {
  const issuedAt = new Date();
  const expiresInSec = Number(tokenObj.expires_in || 7200); // 기본 2시간
  const normalized = {
    access_token:  tokenObj.access_token,
    refresh_token: tokenObj.refresh_token,
    token_type:    tokenObj.token_type || 'Bearer',
    scope:         tokenObj.scope || null,
    issued_at:     issuedAt.toISOString(),
    expires_at:    new Date(issuedAt.getTime() + expiresInSec * 1000).toISOString(),
    raw:           tokenObj, // 로그로 출력 금지!
  };
  const p = tokenPath(mallId, shopNo);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

function loadToken(mallId, shopNo = 1) {
  try {
    const p = tokenPath(mallId, shopNo);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
    // ✅ 레거시 위치에서 자동 마이그레이션
    const lp = legacyPath(mallId);
    if (fs.existsSync(lp)) {
      const legacy = JSON.parse(fs.readFileSync(lp, 'utf-8'));
      const saved = saveToken(mallId, legacy, shopNo);
      console.log(`ℹ️  migrated legacy token → ${p}`);
      return saved;
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { loadToken, saveToken, isExpired, tokenPath };
