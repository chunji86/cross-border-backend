// utils/nonceStore.js
const store = new Map(); // nonce -> exp(ms)

function issueNonce(ttlSec = 300) {
  const n = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const exp = Date.now() + ttlSec * 1000;
  store.set(n, exp);
  return n;
}
function consumeNonce(nonce) {
  const exp = store.get(nonce);
  if (!exp) return false;
  store.delete(nonce);
  return Date.now() <= exp;
}
module.exports = { issueNonce, consumeNonce };
