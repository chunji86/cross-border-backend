const fs = require('fs');
const path = require('path');

function getToken(mall_id) {
  const tokenPath = path.join(__dirname, `../tokens/${mall_id}_token.json`);
  if (!fs.existsSync(tokenPath)) return null;

  const tokenData = fs.readFileSync(tokenPath, 'utf-8');
  return JSON.parse(tokenData);
}

module.exports = { getToken };
