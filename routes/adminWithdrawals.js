// routes/adminWithdrawals.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const prisma = new PrismaClient();

// ✅ PATCH /api/admin/withdrawals/:id/approve - 출금 승인
router.patch('/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'approved' },
    });

    res.json({ message: '출금 승인 완료', request: updated });
  } catch (err) {
    console.error('출금 승인 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ PATCH /api/admin/withdrawals/:id/reject - 출금 거절
router.patch('/:id/reject', authenticate, authorize('ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'rejected' },
    });

    res.json({ message: '출금 거절 완료', request: updated });
  } catch (err) {
    console.error('출금 거절 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
