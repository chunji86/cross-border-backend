// routes/cafe24/saveProducts.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { getValidAccessToken } = require('../../utils/tokenManager');

const prisma = new PrismaClient();

// ✅ Cafe24에서 상품 받아와 DB에 저장
router.post('/', async (req, res) => {
  const { mall_id } = req.body;
  if (!mall_id) {
    return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
  }

  try {
    const access_token = await getValidAccessToken(mall_id);

    const response = await axios.get(`https://${mall_id}.cafe24api.com/api/v2/admin/products`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const products = response.data.products;

    let savedCount = 0;
    for (const p of products) {
      const existing = await prisma.product.findUnique({
        where: { cafe24Id: p.product_no },
      });

      if (!existing) {
        await prisma.product.create({
          data: {
            cafe24Id: p.product_no,
            mallId: mall_id,
            name: p.product_name,
            price: parseInt(p.price?.sell_price || '0'),
            imageUrl: p.list_image, // 필요시 image → detail_image 등으로 변경 가능
          },
        });
        savedCount++;
      }
    }

    res.json({ message: '✅ 상품 저장 완료', savedCount });
  } catch (err) {
    console.error('❌ 상품 저장 실패:', err.response?.data || err.message);
    res.status(500).json({
      error: '상품 저장 실패',
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
