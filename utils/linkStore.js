const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { tokenPath } = require('./tokenManager');

function baseDir(mall_id, shop_no) {
  const dir = path.join(path.dirname(tokenPath(mall_id, shop_no)), `links_${shop_no}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function linksPath(mall_id, shop_no) { return path.join(baseDir(mall_id, shop_no), 'links.json'); }
function clicksPath(mall_id, shop_no) { return path.join(baseDir(mall_id, shop_no), 'clicks.json'); }

function readLinks(mall_id, shop_no) { try { if (fs.existsSync(linksPath(mall_id, shop_no))) return JSON.parse(fs.readFileSync(linksPath(mall_id, shop_no), 'utf-8')); } catch {} return { rows: [] }; }
function writeLinks(mall_id, shop_no, data) { fs.writeFileSync(linksPath(mall_id, shop_no), JSON.stringify(data, null, 2), 'utf-8'); }

function saveLink(mall_id, shop_no, { product_no, influencer_id, campaign=null }) {
  const data = readLinks(mall_id, shop_no);
  const code = crypto.randomBytes(5).toString('hex'); // 10자리 코드
  const row = { code, mall_id, shop_no, product_no: Number(product_no), influencer_id: String(influencer_id), campaign, created_at: new Date().toISOString() };
  data.rows.push(row); writeLinks(mall_id, shop_no, data);
  return code;
}
function getLinkByCode(code) {
  // 모든 몰에서 찾기(간편화). 필요 시 mall 분리 저장으로 최적화 가능.
  // 여기선 최근 파일로 추정 검색 대신 간단히 스캔(데모 규모라 충분).
  try {
    // 호출 시 mall_id를 모르면 전체 스캔이 필요하지만, 데모에서는 OK
    // 실제에선 code→mall_id 인덱스를 별도 저장 권장
  } catch {}
  // 간단 구현: 프로젝트 data 디렉터리를 광범위하게 스캔하지 않고, 최근 한 개 mall만 쓴다고 가정.
  // 더 안전하게 하려면 mall_id를 명시해 주세요.
  return global.__LINK_CACHE__?.[code] || null;
}

// 클릭 저장 (간단)
function saveClick(mall_id, shop_no, { code, ua, referer }) {
  const p = clicksPath(mall_id, shop_no);
  let data = { rows: [] };
  try { if (fs.existsSync(p)) data = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch {}
  data.rows.push({ code, ua, referer, ts: new Date().toISOString() });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

// 서버 부팅 시 링크 인덱스 캐시(선택적). server.js 초기에 한 번 호출해도 됨.
function rebuildCache(mall_id, shop_no) {
  const data = readLinks(mall_id, shop_no);
  global.__LINK_CACHE__ = global.__LINK_CACHE__ || {};
  for (const r of data.rows) global.__LINK_CACHE__[r.code] = r;
}

module.exports = { saveLink, getLinkByCode, saveClick, rebuildCache };
