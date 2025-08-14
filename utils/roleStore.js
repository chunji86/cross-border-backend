const fs = require('fs');
const path = require('path');
const { tokenPath } = require('./tokenManager');

function filePath(mall_id, shop_no) {
  const base = path.dirname(tokenPath(mall_id, shop_no)); // .../data/{mall}/
  const dir = path.join(base, `roles_${shop_no}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'roles.json');
}
function readAll(mall_id, shop_no) {
  const p = filePath(mall_id, shop_no);
  if (!fs.existsSync(p)) return { users: {} };
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) || { users: {} }; } catch { return { users: {} }; }
}
function writeAll(mall_id, shop_no, data) {
  fs.writeFileSync(filePath(mall_id, shop_no), JSON.stringify(data, null, 2), 'utf8');
}

function getUser(mall_id, shop_no, customer_id) {
  const data = readAll(mall_id, shop_no);
  return data.users[`customer_${customer_id}`] || null;
}
function setUser(mall_id, shop_no, customer_id, payload) {
  const data = readAll(mall_id, shop_no);
  data.users[`customer_${customer_id}`] = { ...(data.users[`customer_${customer_id}`] || {}), ...payload };
  writeAll(mall_id, shop_no, data);
  return data.users[`customer_${customer_id}`];
}
function listUsers(mall_id, shop_no, { role, status } = {}) {
  const data = readAll(mall_id, shop_no);
  return Object.entries(data.users)
    .map(([k, v]) => ({ key: k, ...v }))
    .filter(u => (role ? u.role === role : true) && (status ? u.status === status : true));
}

module.exports = { getUser, setUser, listUsers };
