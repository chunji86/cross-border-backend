const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorizeInfluencer } = require('../middlewares/authMiddleware');

const prisma = new PrismaClient();

// ✅ 고급 인플루언서가 상품 복사하여 마이샵에 등록
router.post('/add', authenticate, authorizeInfluencer, async (req, res) => {
  try {
    const influencerId = req.user.id;
    const { originalProductId, title, description, imageUrl, price } = req.body;

    if (!originalProductId || !title || !description || !imageUrl || !price) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    const newProduct = await prisma.influencerProduct.create({
      data: {
        influencerId,
        originalProductId,
        title,
        description,
        imageUrl,
        price,
      },
    });

    res.json({ message: '마이샵에 상품이 복사되었습니다.', product: newProduct });
  } catch (err) {
    console.error('인플루언서 상품 복사 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ 마이샵 상품 목록 조회
router.get('/myshop', authenticate, authorizeInfluencer, async (req, res) => {
  try {
    const influencerId = req.user.id;

    const products = await prisma.influencerProduct.findMany({
      where: { influencerId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ products });
  } catch (err) {
    console.error('마이샵 목록 조회 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ PUT /api/influencer-products/:id - 마이샵 상품 정보 수정
router.put('/:id', authenticate, authorizeInfluencer, async (req, res) => {
  const influencerId = req.user.id;
  const { id } = req.params;
  const { title, description, imageUrl, price } = req.body;

  try {
    const product = await prisma.influencerProduct.findUnique({
      where: { id: Number(id) }
    });

    if (!product || product.influencerId !== influencerId) {
      return res.status(403).json({ error: '수정 권한이 없습니다.' });
    }

    const updated = await prisma.influencerProduct.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        imageUrl,
        price
      }
    });

    res.json({ message: '상품 정보가 수정되었습니다.', updated });
  } catch (err) {
    console.error('상품 수정 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ DELETE /api/influencer-products/:id - 마이샵 상품 삭제
router.delete('/:id', authenticate, authorizeInfluencer, async (req, res) => {
  const influencerId = req.user.id;
  const { id } = req.params;

  try {
    const product = await prisma.influencerProduct.findUnique({
      where: { id: Number(id) }
    });

    if (!product || product.influencerId !== influencerId) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    await prisma.influencerProduct.delete({
      where: { id: Number(id) }
    });

    res.json({ message: '상품이 삭제되었습니다.' });
  } catch (err) {
    console.error('상품 삭제 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
