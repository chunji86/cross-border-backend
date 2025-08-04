// routes/clickTracker.js
const express = require('express');
const router = express.Router();

// ✅ GET /api/click?ref=2 - 클릭 추적 (쿠키 저장)
router.get('/click', (req, res) => {
  const { ref } = req.query;

  if (!ref) {
    return res.status(400).json({ error: 'ref 파라미터가 필요합니다.' });
  }

  // 30일 (30일 * 24시간 * 60분 * 60초 * 1000ms)
  const expireMs = 30 * 24 * 60 * 60 * 1000;

  res.cookie('ref', ref, {
    maxAge: expireMs,
    httpOnly: false, // 프론트 JS에서도 접근 가능
    sameSite: 'lax',
  });

  res.json({ message: '쿠키 저장 성공', ref });
});

module.exports = router;
