// routes/withdrawals.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const prisma = new PrismaClient();

// ✅ GET /api/withdrawals - 내 출금 신청 내역
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      message: '출금 내역 조회 성공',
      withdrawals,
    });
  } catch (err) {
    console.error('출금 내역 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ POST /api/withdrawals - 출금 신청
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { amount, bank, account } = req.body;

  if (!amount || !bank || !account) {
    return res.status(400).json({ error: 'amount, bank, account는 필수입니다.' });
  }

  try {
    const request = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount,
        bank,
        account,
      },
    });

    res.json({
      message: '출금 신청 완료',
      request,
    });
  } catch (err) {
    console.error('출금 신청 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ GET /api/withdrawals/pending - 관리자용 대기 출금 요청 목록
router.get('/pending', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const pendingRequests = await prisma.withdrawalRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pendingRequests);
  } catch (err) {
    console.error('출금 대기 목록 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ POST /api/withdrawals/:id/approved - 관리자 승인 처리
router.post('/:id/approved', authenticate, authorize('ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date() },
    });
    res.json({ message: '승인 완료', updated });
  } catch (err) {
    console.error('출금 승인 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ POST /api/withdrawals/:id/rejected - 관리자 거절 처리
router.post('/:id/rejected', authenticate, authorize('ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'rejected' },
    });
    res.json({ message: '거절 완료', updated });
  } catch (err) {
    console.error('출금 거절 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
