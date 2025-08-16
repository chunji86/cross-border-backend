// routes/track.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { resolveInfluencerIdFromRc } = require('../services/rcMatcher');

const prisma = new PrismaClient();

/**
 * POST /api/track
 * Body: { mall_id, shop_no, order_id, rc }
 * 목적: 주문완료 페이지에서 rc → Order.influencerId 매핑 영구 저장
 */
router.post('/', async (req, res) => {
  try {
    const { mall_id, shop_no, order_id, rc } = req.body || {};
    if (!mall_id || !shop_no || !order_id) {
      return res.status(400).json({ error: 'mall_id, shop_no, order_id는 필수입니다.' });
    }

    const influencerId = await resolveInfluencerIdFromRc(rc);
    // rc가 없거나 잘못돼도 200으로 처리 (운영 편의), 단 서버 로그는 남김
    if (!influencerId) {
      console.warn('[track] rc 미해석 또는 미지정:', { rc, mall_id, shop_no, order_id });
      // Order가 있으면 그대로 upsert (influencerId null)
      await prisma.order.upsert({
        where: { externalId: String(order_id) },
        create: {
          externalId: String(order_id),
          mallId: String(mall_id),
          shopNo: Number(shop_no),
          status: 'PENDING',
          totalAmount: 0,
        },
        update: {},
      });
      return res.json({ ok: true, influencerId: null });
    }

    // upsert: 주문이 이미 동기화된 경우도 influencerId만 채움
    await prisma.order.upsert({
      where: { externalId: String(order_id) },
      create: {
        externalId: String(order_id),
        mallId: String(mall_id),
        shopNo: Number(shop_no),
        status: 'PENDING',
        totalAmount: 0,
        influencerId,
      },
      update: { influencerId },
    });

    return res.json({ ok: true, influencerId });
  } catch (err) {
    console.error('POST /api/track error:', err);
    return res.status(500).json({ error: 'track 저장 실패', detail: String(err?.message || err) });
  }
});

module.exports = router;
