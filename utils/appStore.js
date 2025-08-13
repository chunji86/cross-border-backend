// utils/appStore.js
const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const APP_DIR  = path.join(DATA_DIR, 'app');

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }
async function readJSON(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { return fallback; }
}
async function writeJSON(file, obj) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(obj, null, 2), 'utf8');
}

function dirFor(mall_id, shop_no) {
  return path.join(APP_DIR, mall_id, String(shop_no));
}

// ─────────── Rewards (전역 + 인플루언서별) ───────────
async function getRewardConfig(mall_id, shop_no) {
  const file = path.join(dirFor(mall_id, shop_no), 'rewards.json');
  const data = await readJSON(file, null);
  return data || { default_rate: 0.10, influencers: {} }; // 기본 10%
}

async function setRewardConfig(mall_id, shop_no, config) {
  const file = path.join(dirFor(mall_id, shop_no), 'rewards.json');
  const safe = {
    default_rate: Number(config.default_rate ?? 0.10),
    influencers: config.influencers || {}
  };
  await writeJSON(file, safe);
  return safe;
}

// ─────────── Assign (상품↔인플루언서) ───────────
async function listAssignments(mall_id, shop_no) {
  const file = path.join(dirFor(mall_id, shop_no), 'assignments.json');
  return await readJSON(file, []);
}

async function upsertAssignment(mall_id, shop_no, payload) {
  const file = path.join(dirFor(mall_id, shop_no), 'assignments.json');
  const list = await readJSON(file, []);
  const key = (r) => `${r.product_no}:${r.influencer_id}`;
  const next = { 
    product_no: Number(payload.product_no),
    influencer_id: String(payload.influencer_id),
    commission_rate: payload.commission_rate == null ? null : Number(payload.commission_rate),
    enabled: payload.enabled !== false,
    updated_at: new Date().toISOString()
  };
  const idx = list.findIndex(r => key(r) === key(next));
  if (idx >= 0) list[idx] = next; else list.push(next);
  await writeJSON(file, list);
  return next;
}

// ─────────── Links (코드→상품 URL) ───────────
function randCode(n=10) {
  const base = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 읽기 쉬운 코드
  return Array.from({length:n}, () => base[Math.floor(Math.random()*base.length)]).join('');
}

async function linksFile(mall_id, shop_no) {
  return path.join(dirFor(mall_id, shop_no), 'links.json');
}

async function createLink(mall_id, shop_no, { product_no, influencer_id, campaign=null }) {
  const file = await linksFile(mall_id, shop_no);
  const store = await readJSON(file, []);
  let code; do { code = randCode(8); } while (store.some(x => x.code === code));
  const row = {
    code, mall_id, shop_no: Number(shop_no),
    product_no: Number(product_no),
    influencer_id: String(influencer_id),
    campaign: campaign || null,
    enabled: true,
    created_at: new Date().toISOString()
  };
  store.push(row);
  await writeJSON(file, store);
  return row;
}

async function listLinks(mall_id, shop_no) {
  const file = await linksFile(mall_id, shop_no);
  return await readJSON(file, []);
}

// 코드 전역 조회(몰/샵 모를 때)
// 규모가 작으므로 전체 디렉터리 선형 탐색
async function findLinkByCode(code) {
  try {
    const malls = await fs.readdir(APP_DIR);
    for (const m of malls) {
      const mallPath = path.join(APP_DIR, m);
      const shops = await fs.readdir(mallPath);
      for (const s of shops) {
        const arr = await readJSON(path.join(mallPath, s, 'links.json'), []);
        const hit = arr.find(x => x.code === code && x.enabled !== false);
        if (hit) return hit;
      }
    }
  } catch {}
  return null;
}

// 상품 상세 URL 만들기
function buildProductUrl(mall_id, product_no, rc) {
  const tpl = process.env.PRODUCT_URL_TEMPLATE
    || 'https://{mall}.cafe24.com/product/detail.html?product_no={product_no}';
  const base = tpl.replace('{mall}', mall_id).replace('{product_no}', String(product_no));
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}rc=${encodeURIComponent(rc)}`;
}

module.exports = {
  getRewardConfig, setRewardConfig,
  listAssignments, upsertAssignment,
  createLink, listLinks, findLinkByCode,
  buildProductUrl,
};
