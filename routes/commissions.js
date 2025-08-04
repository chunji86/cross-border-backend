// routes/commission.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const prisma = new PrismaClient();

// ✅ GET /api/commission - 인플루언서 리워드 수익 조회
router.get('/', authenticate, authorize(['INFLUENCER', 'ADV_INFLUENCER']), async (req, res) => {
  const userId = req.user.id;

  try {
    // 총 적립 금액 계산
    const total = await prisma.reward.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    // 최근 적립 내역 10개
    const recent = await prisma.reward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      totalEarned: total._sum.amount || 0,
      recentRewards: recent,
    });
  } catch (err) {
    console.error('커미션 수익 조회 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
