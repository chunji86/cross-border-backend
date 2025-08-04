// 📁 controllers/productsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ 공급사 상품 등록
exports.createProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { name, description, price, shippingFee } = req.body;
    const imageUrl = req.file?.filename;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseInt(price),
        shippingFee: parseInt(shippingFee),
        imageUrl,
        vendorId
      }
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('상품 등록 오류:', err);
    res.status(500).json({ error: '상품 등록에 실패했습니다.' });
  }
};

// ✅ 공급사 상품 목록 조회
exports.getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const products = await prisma.product.findMany({
      where: { vendorId }
    });
    res.json(products);
  } catch (err) {
    console.error('상품 목록 조회 오류:', err);
    res.status(500).json({ error: '상품 목록 조회에 실패했습니다.' });
  }
};

// ✅ 상품 삭제
exports.deleteProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const vendorId = req.user.id;

    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.vendorId !== vendorId) {
      return res.status(404).json({ error: '상품을 찾을 수 없거나 권한이 없습니다.' });
    }

    await prisma.product.delete({ where: { id: productId } });
    res.json({ message: '상품이 삭제되었습니다.' });
  } catch (err) {
    console.error('상품 삭제 오류:', err);
    res.status(500).json({ error: '상품 삭제에 실패했습니다.' });
  }
};
