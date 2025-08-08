const express = require('express');
const axios = require('axios');
const router = express.Router();
const qs = require('qs');
const fs = require('fs');
const path = require('path');

const tokenDir = path.join(__dirname, '../tokens');
if (!fs.existsSync(tokenDir)) fs.mkdirSync(tokenDir);

// 🔽 콜백 라우터
router.get('/callback', async (req, res) => {
  const { code, state: mall_id } = req.query;
  console.log('📥 [callback] code:', code);
  console.log('📥 [callback] mall_id:', mall_id);

  if (!code || !mall_id) {
    return res.status(400).json({ error: 'code 또는 mall_id 누락됨' });
  }

  try {
    const tokenUrl = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${process.env.CAFE24_CLIENT_ID}:${process.env.CAFE24_CLIENT_SECRET}`).toString('base64'),
    };

    const data = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.CAFE24_REDIRECT_URI,
    });

    console.log('🚀 [Token 요청] POST', tokenUrl);
    console.log('📦 [Token 요청] Headers:', headers);
    console.log('📦 [Token 요청] Body:', data);

    const tokenRes = await axios.post(tokenUrl, data, { headers });
    console.log('✅ [Token 응답] 성공:', tokenRes.data);

    // 🔽 토큰 저장
    const tokenPath = path.join(tokenDir, `${mall_id}_token.json`);
    fs.writeFileSync(tokenPath, JSON.stringify(tokenRes.data, null, 2));
    console.log(`💾 [Token 저장 완료] ${tokenPath}`);

    return res.send(`✅ ${mall_id} 토큰 저장 완료`);
  } catch (error) {
    console.error('❌ [토큰 요청 실패]', error.response?.data || error.message);
    return res.status(500).json({ error: '토큰 요청 실패', detail: error.response?.data || error.message });
  }
});

module.exports = router;
