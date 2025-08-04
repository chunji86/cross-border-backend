// routes/orders.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middlewares/authMiddleware');

const prisma = new PrismaClient();

// ✅ 장바구니 전체 주문 처리
router.post('/bulk', authenticate, async (req, res) => {
  const customerId = req.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '주문할 상품이 없습니다.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. 주문 생성
      const newOrder = await tx.order.create({
        data: {
          customerId
        }
      });

      // 2. 주문 상품 처리
      for (const item of items) {
        const { productId, quantity = 1 } = item;

        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (!product) throw new Error('상품을 찾을 수 없습니다.');

        const totalAmount = product.price * quantity;

        // 3. 인플루언서 추적 (쿠키 기반 또는 리퍼러 기반 처리 가능)
        let influencerId = null;
        const click = await tx.click.findFirst({
          where: {
            productId,
            userId: customerId // 최근 클릭 기록 중 본인의 것
          },
          orderBy: { createdAt: 'desc' }
        });
        if (click) influencerId = click.influencerId;

        // 4. OrderItem 생성
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId,
            quantity,
            totalAmount,
            influencerId
          }
        });

        // 5. 리워드 계산 및 적립
        if (influencerId && product.rewardRate > 0) {
          const rewardAmount = Math.floor(product.price * product.rewardRate) * quantity;
          if (rewardAmount > 0) {
            await tx.reward.create({
              data: {
                influencerId,
                orderItemId: orderItem.id,
                amount: rewardAmount
              }
            });
          }
        }
      }

      return newOrder;
    });

    res.json({ success: true, orderId: result.id });
  } catch (err) {
    console.error('주문 실패:', err);
    res.status(500).json({ error: '주문 처리 중 오류 발생' });
  }
});

module.exports = router;
