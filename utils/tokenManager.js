// utils/tokenManager.js
const axios = require('axios');
const qs = require('qs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;

function b64(s) { return Buffer.from(s).toString('base64'); }
function isExpired(expiresAt) {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now();
}

async function getTokenRow(mallId) {
  return prisma.cafe24Token.findUnique({ where: { mallId } });
}

async function upsertTokens({ mallId, access_token, refresh_token, scope, expires_in }) {
  const expiresAt = new Date(Date.now() + (expires_in - 60) * 1000);
  return prisma.cafe24Token.upsert({
    where: { mallId },
    update: {
      accessToken: access_token,
      refreshToken: refresh_token ?? null,
      scope: scope ?? null,
      expiresAt
    },
    create: {
      mallId,
      accessToken: access_token,
      refreshToken: refresh_token ?? null,
      scope: scope ?? null,
      expiresAt
    }
  });
}

async function tokenRequest(mallId, payload) {
  const url = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${b64(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
  };
  const { data } = await axios.post(url, qs.stringify(payload), { headers, timeout: 15000 });
  return data;
}

async function refreshAccessToken(mallId) {
  const row = await getTokenRow(mallId);
  if (!row?.refreshToken) throw new Error('No refresh token saved');
  const data = await tokenRequest(mallId, {
    grant_type: 'refresh_token',
    refresh_token: row.refreshToken
  });
  await upsertTokens({
    mallId,
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? row.refreshToken,
    scope: data.scope ?? row.scope,
    expires_in: data.expires_in
  });
  const updated = await getTokenRow(mallId);
  return updated.accessToken;
}

// 항상 유효 토큰 반환 (없거나 만료면 자동 리프레시)
async function getValidAccessToken(mallId) {
  const row = await getTokenRow(mallId);
  if (!row) throw new Error('Token not found for this mall_id');
  if (isExpired(row.expiresAt)) {
    return refreshAccessToken(mallId);
  }
  return row.accessToken;
}

module.exports = {
  getValidAccessToken,
  refreshAccessToken,
};
