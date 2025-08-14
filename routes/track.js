// routes/track.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 고객 IP 추출 유틸
function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
}

// 1) 위젯 이벤트 수신
router.post('/rc', async (req, res) => {
  try {
    const { mallId, shopNo, cid, rc, event, url, referrer, orderNoHint } = req.body || {};
    if (!mallId || !shopNo || !cid || !event) {
      return res.status(400).json({ error: 'mallId, shopNo, cid, event는 필수입니다.' });
    }
    await prisma.rcAttribution.create({
      data: {
        mallId,
        shopNo,
        cid,
        rc: rc || null,
        event,
        url: url || null,
        referrer: referrer || null,
        orderNoHint: orderNoHint || null,
        ip: getIp(req),
        userAgent: req.headers['user-agent'] || null,
      }
    });
    return res.json({ ok: true });
  } catch (e) {
    console.error('track/rc error', e);
    return res.status(500).json({ error: 'track failed' });
  }
});

router.get('/ping', (req, res) => res.json({ ok: true, now: Date.now() }));

module.exports = router;
