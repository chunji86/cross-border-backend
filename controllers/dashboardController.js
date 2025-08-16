// controllers/dashboardController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcByBps, bucketByStatus, resolveBps } = require('../services/rewardEngine');

/**
 * 인플루언서 요약 집계
 * GET /api/dashboard/influencer/:influencerId/summary
 * - pending / confirmed 합계
 * - 최근 라인아이템 20개
 */
async function getInfluencerSummary(req, res) {
  try {
    const influencerId = Number(req.params.influencerId);
    if (!influencerId) return res.status(400).json({ error: 'influencerId 필요' });

    // Order / OrderItem 이 없는 스키마 환경에서도 안전하게 처리
    const hasOrder = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name ILIKE 'Order' OR table_name ILIKE 'orders'
      LIMIT 1
    `).then(r => Array.isArray(r) && r.length > 0).catch(() => false);

    if (!hasOrder) {
      return res.json({ ok: true, influencerId, summary: { pending: 0, confirmed: 0, count: 0 }, recent: [] });
    }

    // 최신 200건만 (성능/UI 목적)
    const orders = await prisma.order.findMany({
      where: { influencerId },
      select: {
        id: true, externalId: true, status: true, totalAmount: true,
        items: { select: { productId: true, unitPrice: true, quantity: true, status: true } }
      },
      orderBy: { id: 'desc' },
      take: 200
    });

    let pending = 0, confirmed = 0, lines = [];

    for (const o of orders) {
      // (A) 아이템 단위 집계
      if (o.items && o.items.length) {
        for (const it of o.items) {
          const itemAmount = Math.max(0, (it.unitPrice || 0) * (it.quantity || 0));
          const bps = resolveBps({ productBps: null, vendorBps: null, defaultBps: 500 }); // 기본 5%
          const reward = calcByBps(itemAmount, bps);
          const bucket = bucketByStatus(it.status || o.status);

          if (bucket === 'CONFIRMED') confirmed += reward; else pending += reward;

          lines.push({
            externalId: o.externalId,
            productId: it.productId ?? null,
            qty: it.quantity ?? null,
            amount: itemAmount,
            reward,
            bucket
          });
        }
      }
      // (B) 주문 단위 집계 (아이템 구조 없을 때)
      else {
        const bps = resolveBps({ defaultBps: 500 });
        const reward = calcByBps(o.totalAmount, bps);
        const bucket = bucketByStatus(o.status);

        if (bucket === 'CONFIRMED') confirmed += reward; else pending += reward;

        lines.push({
          externalId: o.externalId,
          productId: null,
          qty: null,
          amount: o.totalAmount,
          reward,
          bucket
        });
      }
    }

    return res.json({
      ok: true,
      influencerId,
      summary: { pending, confirmed, count: orders.length },
      recent: lines.slice(0, 20)
    });
  } catch (err) {
    console.error('[dashboard] getInfluencerSummary error:', err);
    return res.status(500).json({ error: '요약 집계 실패', detail: String(err?.message || err) });
  }
}

module.exports = {
  getInfluencerSummary,
};
