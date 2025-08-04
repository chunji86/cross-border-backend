const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ 인플루언서가 링크 생성
const createPromotionLink = async (req, res) => {
  try {
    const { productId } = req.body;
    const influencerId = req.user.id;

    const existingLink = await prisma.promotionLink.findFirst({
      where: {
        productId,
        influencerId
      }
    });

    if (existingLink) {
      return res.status(200).json({ link: existingLink });
    }

    const newLink = await prisma.promotionLink.create({
      data: {
        productId,
        influencerId
      }
    });

    res.status(201).json({ link: newLink });
  } catch (error) {
    console.error('링크 생성 오류:', error);
    res.status(500).json({ error: '링크 생성 중 오류 발생' });
  }
};

// ✅ 인플루언서가 생성한 링크 전체 조회
const getPromotionLinks = async (req, res) => {
  try {
    const influencerId = req.user.id;
    const links = await prisma.promotionLink.findMany({
      where: { influencerId },
      include: { product: true }
    });

    res.status(200).json({ links });
  } catch (error) {
    console.error('링크 조회 오류:', error);
    res.status(500).json({ error: '링크 조회 중 오류 발생' });
  }
};

module.exports = {
  createPromotionLink,
  getPromotionLinks,
};
