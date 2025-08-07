// controllers/cafe24SyncController.js
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MALL_ID = process.env.CAFE24_MALL_ID;
const ACCESS_TOKEN = process.env.CAFE24_ACCESS_TOKEN;

exports.syncCafe24Products = async (req, res) => {
  try {
    const response = await axios.get(`https://${MALL_ID}.cafe24api.com/api/v2/admin/products`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const products = response.data.products;

    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: {
          externalId: String(product.product_no), // 외부 ID 기준 중복 체크
        },
      });

      if (existing) {
        // 업데이트 (변경된 정보만 반영)
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: product.product_name,
            price: parseFloat(product.price_standard),
            description: product.summary_description || '',
            imageUrl: product.list_image || '',
            updatedAt: new Date(),
          },
        });
      } else {
        // 신규 등록
        await prisma.product.create({
          data: {
            externalId: String(product.product_no),
            name: product.product_name,
            price: parseFloat(product.price_standard),
            description: product.summary_description || '',
            imageUrl: product.list_image || '',
            stock: 9999,
            deliveryFee: 3000,
            vendorId: 1, // 기본 공급사 ID 또는 매핑 로직 필요
            country: 'KR',
          },
        });
      }
    }

    res.status(200).json({ message: 'Cafe24 상품 동기화 완료', count: products.length });
  } catch (error) {
    console.error('🛑 Cafe24 상품 동기화 오류:', error.response?.data || error.message);
    res.status(500).json({ error: 'Cafe24 상품 동기화 실패' });
  }
};
