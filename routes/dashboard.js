// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getInfluencerSummary } = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/authMiddleware');

// 인플루언서 집계 API
router.get('/influencer/:influencerId/summary', authenticate, getInfluencerSummary);

module.exports = router;
