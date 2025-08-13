const express = require('express');
const router = express.Router();

router.use('/supplier', require('./supplier'));     // 공급사용 API
router.use('/influencer', require('./influencer')); // 인플루언서용 API

// 링크 리다이렉트 (테스트용): /api/app/go/:code → 몰 상품 상세로 리다이렉트
router.get('/go/:code', require('./links').redirectByCode);

module.exports = router;
