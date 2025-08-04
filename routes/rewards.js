// ✅ 세 번째: routes/rewards.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ POST /api/rewards - 리워드 적립 (상품 구매 시 호출)
router.post('/', async (req, res) => {
  const { userId, productId, amount, orderId = 9999 } = req.body;

  if (!userId || !productId || !amount) {
    return res.status(400).json({ error: 'userId, productId, amount는 필수입니다.' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.rewardRate) {
      return res.status(404).json({ error: '유효하지 않은 상품입니다.' });
    }

    const rewardAmount = Math.floor((product.rewardRate / 100) * amount);

    const reward = await prisma.reward.create({
      data: {
        userId,
        productId,
        amount: rewardAmount,
        orderId
      },
    });

    res.json({
      message: '리워드 적립 성공',
      reward,
    });
  } catch (err) {
    console.error('리워드 적립 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ GET /api/rewards/summary - 인플루언서 리워드 요약
router.get('/summary', async (req, res) => {
  const userId = parseInt(req.query.userId); // 임시 테스트용, 실제로는 토큰에서 추출

  if (!userId) {
    return res.status(400).json({ error: 'userId가 필요합니다.' });
  }

  try {
    const rewards = await prisma.reward.findMany({
      where: { userId },
    });

    const totalReward = rewards.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      totalReward,
      rewardCount: rewards.length,
    });
  } catch (err) {
    console.error('리워드 요약 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
