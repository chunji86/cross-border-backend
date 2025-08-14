const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient();

function setSession(res, payload) {
  const token = jwt.sign(payload, process.env.SESSION_SECRET, { expiresIn: '7d' });
  res.cookie('cb_session', token, {
    httpOnly: true, sameSite: 'lax', secure: true, maxAge: 7*24*3600*1000
  });
}

// 1) 회원가입
router.post('/signup', async (req, res) => {
  const { email, password, name, mall_id, shop_no } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email/password required' });
  const hash = await bcrypt.hash(password, 10);

  // const created = await prisma.influencer.create({ data: { email, password: hash, name, mallId: mall_id, shopNo: String(shop_no||'1') }});
  // setSession(res, { role:'influencer', influencer_id: created.id, mall_id, shop_no });
  // res.json({ ok:true });

  // 파일 기반 임시 저장을 쓰고 있다면 여기에 저장 로직을 넣으세요
  res.json({ ok:true, note:'TODO: connect DB and set session' });
});

// 2) 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email/password required' });

  // const inf = await prisma.influencer.findUnique({ where: { email }});
  // if (!inf) return res.status(401).json({ error:'invalid' });
  // const ok = await bcrypt.compare(password, inf.password);
  // if (!ok) return res.status(401).json({ error:'invalid' });

  // setSession(res, { role:'influencer', influencer_id: inf.id, mall_id: inf.mallId, shop_no: inf.shopNo });
  res.json({ ok:true, note:'TODO: connect DB and set session' });
});

module.exports = router;
