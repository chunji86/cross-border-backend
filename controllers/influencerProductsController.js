// 📁 controllers/influencerProductsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');

const createInfluencerProduct = async (req, res) => {
  try {
    const influencerId = req.user.id;
    const {
      originalProductId,
      title,
      description,
      price
    } = req.body;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newProduct = await prisma.influencerProduct.create({
      data: {
        influencerId,
        originalProductId: parseInt(originalProductId),
        title,
        description,
        imageUrl,
        price: parseInt(price),
      },
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('인플루언서 상품 생성 오류:', error);
    res.status(500).json({ error: '인플루언서 상품 생성 실패' });
  }
};

const getMyInfluencerProducts = async (req, res) => {
  try {
    const influencerId = req.user.id;

    const products = await prisma.influencerProduct.findMany({
      where: { influencerId },
      include: { originalProduct: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(products);
  } catch (error) {
    console.error('인플루언서 상품 조회 오류:', error);
    res.status(500).json({ error: '상품 조회 실패' });
  }
};

module.exports = {
  createInfluencerProduct,
  getMyInfluencerProducts,
};
