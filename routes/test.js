// routes/test.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.post('/expire-token', (req, res) => {
  const mallId = req.body.mall_id;
  const tokenPath = path.join(__dirname, '..', 'tokens', `${mallId}_token.json`);

  try {
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));

    // ✅ expires_at을 1시간 전으로 덮어쓰기
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    tokenData.expires_at = pastDate;

    fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2), 'utf-8');

    console.log(`✅ [TEST] expires_at을 과거로 수정함: ${pastDate}`);
    return res.json({ message: '토큰 만료일을 과거로 설정했습니다.', expires_at: pastDate });
  } catch (error) {
    console.error('❌ [TEST] 토큰 수정 중 오류:', error);
    return res.status(500).json({ error: '토큰 수정 실패' });
  }
});

module.exports = router;
