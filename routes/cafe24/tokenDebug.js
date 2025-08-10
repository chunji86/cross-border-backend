const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// 전체 목록(민감정보 제거)
router.get('/debug', async (req, res) => {
  const rows = await prisma.cafe24Token.findMany({
    select: { mallId: true, expiresAt: true, updatedAt: true }
  });
  res.json({ count: rows.length, mallIds: rows });
});

// 특정 몰 존재 여부
router.get('/debug/:mallId', async (req, res) => {
  const mallId = req.params.mallId;
  const row = await prisma.cafe24Token.findUnique({
    where: { mallId },
    select: { mallId: true, expiresAt: true, updatedAt: true }
  });
  if (!row) return res.status(404).json({ exists: false });
  res.json({ exists: true, ...row });
});

module.exports = router;
