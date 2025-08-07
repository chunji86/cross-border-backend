const express = require('express');
const router = express.Router();

// ✅ POST: 실제 Webhook 요청 처리용
router.post('/', (req, res) => {
  console.log('📦 Cafe24 Webhook Received:', req.body);
  res.status(200).send('OK');
});

// ✅ GET: 브라우저에서 테스트용 확인 라우터
router.get('/', (req, res) => {
  res.send('✅ Cafe24 callback route is working!');
});

module.exports = router;
