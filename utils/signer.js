// utils/signer.js
const crypto = require('crypto');

const SECRET = process.env.APP_SIGNING_SECRET || 'dev-sign-secret';

function sign(params) {
  const payload = JSON.stringify(params);
  const h = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64url') + '.' + h;
}
function verify(token) {
  const [b64, h] = String(token || '').split('.');
  if (!b64 || !h) return null;
  const payload = Buffer.from(b64, 'base64url').toString('utf8');
  const h2 = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  if (h !== h2) return null;
  try { return JSON.parse(payload); } catch { return null; }
}

module.exports = { sign, verify };
