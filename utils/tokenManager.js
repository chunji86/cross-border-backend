// utils/tokenManager.js
const fs = require('fs');
const path = require('path');
const os = require('os');

function ensureWritableDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch { return false; }
}

// 우선순위: DATA_DIR(env) → ./data → OS tmp
const candidates = [];
if (process.env.DATA_DIR) candidates.push(process.env.DATA_DIR);
candidates.push(path.join(process.cwd(), 'data'));
candidates.push(path.join(os.tmpdir(), 'cafe24-data'));

let DATA_DIR = null;
for (const d of candidates) {
  if (ensureWritableDir(d)) { DATA_DIR = d; break; }
}
if (!DATA_DIR) throw new Error('No writable data directory available');

const LEGACY_DIR = path.join(process.cwd(), 'tokens');

function tokenPath(mallId, shopNo = 1) {
  const dir = path.join(DATA_DIR, mallId);
  ensureWritableDir(dir);
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
  const expiresInSec = Number(tokenObj.expires_in || 7200);
  const normalized = {
    access_token:  tokenObj.access_token,
    refresh_token: tokenObj.refresh_token,
    token_type:    tokenObj.token_type || 'Bearer',
    scope:         tokenObj.scope || null,
    issued_at:     issuedAt.toISOString(),
    expires_at:    new Date(issuedAt.getTime() + expiresInSec * 1000).toISOString(),
    raw:           tokenObj, // 로그로 출력 금지
  };
  fs.writeFileSync(tokenPath(mallId, shopNo), JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

function loadToken(mallId, shopNo = 1) {
  try {
    const p = tokenPath(mallId, shopNo);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
    // 레거시 자동 마이그레이션
    const lp = legacyPath(mallId);
    if (fs.existsSync(lp)) {
      const legacy = JSON.parse(fs.readFileSync(lp, 'utf-8'));
      const saved = saveToken(mallId, legacy, shopNo);
      console.log(`ℹ️ migrated legacy token → ${p}`);
      return saved;
    }
    return null;
  } catch { return null; }
}

module.exports = { loadToken, saveToken, isExpired, tokenPath };
