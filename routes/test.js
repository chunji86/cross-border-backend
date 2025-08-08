// routes/test.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ✅ 경로 정의
const tokenPath = path.join(__dirname, '../tokens/hanfen_token.json');

// ✅ POST /api/test/expire-token
router.post('/expire-token', async (req, res) => {
  try {
    // 파일 존재 여부 확인
    if (!fs.existsSync(tokenPath)) {
      return res.status(404).json({ error: 'Token file not found' });
    }

    // 토큰 파일 읽기
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    // expires_at을 과거로 수정
    tokenData.expires_at = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10분 전

    // 덮어쓰기
    fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
    console.log('✅ [TEST] 토큰 수정 완료');

    res.json({ success: true, newExpiresAt: tokenData.expires_at });
  } catch (err) {
    console.error('❌ [TEST] 토큰 수정 중 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
