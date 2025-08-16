// services/cafe24Client.js
const fetch = require("node-fetch");

async function getAccessToken() {
  const resp = await fetch(
    `https://${process.env.CAFE24_MALL_ID}.cafe24api.com/api/v2/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.CAFE24_REFRESH_TOKEN,
        client_id: process.env.CAFE24_CLIENT_ID,
        client_secret: process.env.CAFE24_CLIENT_SECRET,
      }),
    }
  );

  const data = await resp.json();
  if (!resp.ok) throw new Error(JSON.stringify(data));

  return data.access_token;
}

module.exports = { getAccessToken };
