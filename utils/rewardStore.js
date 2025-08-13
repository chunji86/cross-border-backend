const fs = require('fs');
const path = require('path');
const { tokenPath } = require('./tokenManager');

function baseDir(mall_id, shop_no) {
  const dir = path.join(path.dirname(tokenPath(mall_id, shop_no)), `rewards_${shop_no}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function cfgPath(mall_id, shop_no) { return path.join(baseDir(mall_id, shop_no), 'config.json'); }
function asgPath(mall_id, shop_no) { return path.join(baseDir(mall_id, shop_no), 'assignments.json'); }

function getConfig(mall_id, shop_no) {
  try {
    const p = cfgPath(mall_id, shop_no);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {}
  return { mall_id, shop_no, default_rate: 0.1, influencers: {}, updated_at: new Date().toISOString() };
}
function setConfig(mall_id, shop_no, input={}) {
  const cur = getConfig(mall_id, shop_no);
  const next = {
    mall_id, shop_no,
    default_rate: Number(input.default_rate ?? cur.default_rate ?? 0.1),
    influencers: Object(input.influencers) === input.influencers ? input.influencers : (cur.influencers || {}),
    updated_at: new Date().toISOString()
  };
  fs.writeFileSync(cfgPath(mall_id, shop_no), JSON.stringify(next, null, 2), 'utf-8');
  return next;
}
function getAssignments(mall_id, shop_no) {
  try {
    const p = asgPath(mall_id, shop_no);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {}
  return { rows: [] };
}
function upsertAssignment(mall_id, shop_no, row) {
  const data = getAssignments(mall_id, shop_no);
  const idx = data.rows.findIndex(r => r.product_no == row.product_no && r.influencer_id == row.influencer_id);
  const rec = {
    product_no: Number(row.product_no),
    influencer_id: String(row.influencer_id),
    enabled: !!row.enabled,
    commission_rate: row.commission_rate != null ? Number(row.commission_rate) : null,
    updated_at: new Date().toISOString()
  };
  if (idx >= 0) data.rows[idx] = rec; else data.rows.push(rec);
  fs.writeFileSync(asgPath(mall_id, shop_no), JSON.stringify(data, null, 2), 'utf-8');
  return rec;
}
// 우선순위: assignment(개별율) > influencer 기본율 > 전역 기본율
function resolveRate(cfg, influencer_id, product_no) {
  const asg = getAssignments(cfg.mall_id, cfg.shop_no).rows.find(r => r.influencer_id == influencer_id && r.product_no == product_no && r.enabled);
  if (asg && asg.commission_rate != null) return Number(asg.commission_rate);
  const infRate = cfg.influencers && cfg.influencers[influencer_id];
  if (infRate != null) return Number(infRate);
  return Number(cfg.default_rate || 0);
}

module.exports = { getConfig, setConfig, getAssignments, upsertAssignment, resolveRate };
