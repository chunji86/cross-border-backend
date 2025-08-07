const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '../access_token.json');

const saveToken = (tokenData) => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2), 'utf-8');
};

const getToken = () => {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  const data = fs.readFileSync(TOKEN_PATH, 'utf-8');
  return JSON.parse(data);
};

module.exports = { saveToken, getToken };
