// utils/cache.js
const store = new Map(); // key -> { data, exp }

function setCache(key, data, ttlSec = 90) {
  store.set(key, { data, exp: Date.now() + ttlSec * 1000 });
}
function getCache(key) {
  const v = store.get(key);
  if (!v) return null;
  if (Date.now() > v.exp) { store.delete(key); return null; }
  return v.data;
}
function delCache(key) { store.delete(key); }

module.exports = { setCache, getCache, delCache };
