// routes/myshopView.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ GET /api/myshop/view/:userId - 특정 인플루언서의 마이샵 상품 목록 조회
router.get('/view/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const items = await prisma.myShopItem.findMany({
      where: { userId: parseInt(userId) },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      userId: parseInt(userId),
      count: items.length,
      products: items.map(item => item.product)
    });
  } catch (err) {
    console.error('마이샵 상품 조회 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
