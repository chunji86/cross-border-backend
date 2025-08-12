// utils/syncState.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

function statePath(mallId, shopNo = 1) {
  const dir = path.join(DATA_DIR, mallId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${shopNo}.sync.json`);
}

function loadState(mallId, shopNo = 1) {
  const p = statePath(mallId, shopNo);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function saveState(mallId, shopNo = 1, s = {}) {
  const now = new Date().toISOString();
  const prev = loadState(mallId, shopNo) || {};
  const merged = { ...prev, ...s, last_run_at: now };
  fs.writeFileSync(statePath(mallId, shopNo), JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

module.exports = { loadState, saveState, statePath };
