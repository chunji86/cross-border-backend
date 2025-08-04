// routes/adminProducts.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const prisma = new PrismaClient();

// ✅ POST /api/admin/products - 상품 등록 (관리자용)
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  const {
    name,
    description,
    price,
    imageUrl,
    stock,
    rewardRate,
  } = req.body;

  if (!name || !price || !stock || rewardRate == null) {
    return res.status(400).json({
      error: 'name, price, stock, rewardRate는 필수입니다.',
    });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price,
        imageUrl: imageUrl || '',
        stock,
        rewardRate,
      },
    });

    res.json({ message: '상품 등록 성공', product });
  } catch (err) {
    console.error('상품 등록 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
