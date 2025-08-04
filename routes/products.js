const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const prisma = new PrismaClient();

// 🔧 이미지 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ✅ POST /api/products - 상품 등록
router.post('/', authenticate, authorize('vendor'), upload.single('image'), async (req, res) => {
  const userId = req.user.id;
  const { title, description, price, stock, shippingFee, rewardRate } = req.body;
  const imageFile = req.file;

  if (!title || !description || !price || !stock || !shippingFee || rewardRate == null || !imageFile) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: title,
        description,
        price: parseInt(price),
        stock: parseInt(stock),
        shippingFee: parseInt(shippingFee),
        rewardRate: parseFloat(rewardRate),
        image: `/uploads/${imageFile.filename}`,
        vendorId: userId
      }
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('상품 등록 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ GET /api/products - 전체 상품 목록
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch (err) {
    console.error('상품 목록 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ GET /api/products/my - 공급사 전용 상품 목록
router.get('/my', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { vendorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, products });
  } catch (err) {
    console.error('내 상품 목록 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ GET /api/products/stats - 상품 통계
router.get('/stats', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { vendorId: req.user.id },
      include: { orders: true }
    });

    const stats = products.map(product => {
      const totalOrders = product.orders.length;
      const totalRevenue = product.orders.reduce((sum, o) => sum + o.quantity * product.price, 0);
      const totalReward = Math.floor(totalRevenue * (product.rewardRate / 100));
      return {
        productId: product.id,
        name: product.name,
        totalOrders,
        totalRevenue,
        totalReward
      };
    });

    res.json({ success: true, stats });
  } catch (err) {
    console.error('통계 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ GET /api/products/:id - 상품 상세
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    res.json(product);
  } catch (err) {
    console.error('상품 조회 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ PATCH /api/products/:id - 상품 수정
router.patch('/:id', authenticate, authorize('vendor'), upload.single('image'), async (req, res) => {
  const productId = parseInt(req.params.id);
  const userId = req.user.id;
  const { title, description, price, stock, rewardRate, shippingFee } = req.body;
  const imageFile = req.file;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: '상품 없음' });
    if (product.vendorId !== userId) return res.status(403).json({ error: '권한 없음' });

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: title || product.name,
        description: description || product.description,
        price: price ? parseInt(price) : product.price,
        stock: stock ? parseInt(stock) : product.stock,
        shippingFee: shippingFee ? parseInt(shippingFee) : product.shippingFee,
        rewardRate: rewardRate ? parseFloat(rewardRate) : product.rewardRate,
        image: imageFile ? `/uploads/${imageFile.filename}` : product.image
      }
    });

    res.json({ success: true, product: updated });
  } catch (err) {
    console.error('상품 수정 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ DELETE /api/products/:id - 상품 삭제
router.delete('/:id', authenticate, authorize('vendor'), async (req, res) => {
  const productId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: '상품 없음' });
    if (product.vendorId !== userId) return res.status(403).json({ error: '권한 없음' });

    await prisma.product.delete({ where: { id: productId } });
    res.json({ success: true, message: '삭제 완료' });
  } catch (err) {
    console.error('상품 삭제 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
