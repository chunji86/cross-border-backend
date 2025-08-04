const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middlewares/authMiddleware'); // 🔒 인증 미들웨어 호출

// ✅ POST /api/promotion-links - 인플루언서가 자신의 링크 생성
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'productId는 필수입니다.' });
  }

  const url = `http://localhost:3000/product/${productId}?ref=${userId}`;

  try {
    const existing = await prisma.promotionLink.findUnique({
      where: { url },
    });

    if (existing) {
      return res.status(409).json({ error: '이미 해당 링크가 존재합니다.', link: existing });
    }

    const newLink = await prisma.promotionLink.create({
      data: {
        userId,
        productId,
        url,
      },
    });

    res.json({
      message: '프로모션 링크 생성 완료',
      link: newLink,
    });
  } catch (err) {
    console.error('링크 생성 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
