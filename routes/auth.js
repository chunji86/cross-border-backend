const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ✅ multer 설정 (현재는 메모리 저장, 향후 S3로 확장 가능)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * ✅ 회원가입
 * - 이메일 또는 전화번호 중 하나만 필수
 * - 공급사 / 인플루언서 구분
 * - SNS 링크는 JSON 문자열로 처리
 * - 파일 업로드 처리
 */
router.post(
  '/register',
  upload.fields([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'bankBook', maxCount: 1 },
    { name: 'commerceCertificate', maxCount: 1 },
    { name: 'bankCopy', maxCount: 1 },
    { name: 'idCard', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        email,
        phone,
        password,
        role,
        isAdvanced,
        snsLinks
      } = req.body;

      // ✅ 필수값 확인
      if (!password || (!email && !phone)) {
        return res.status(400).json({ error: '이메일 또는 전화번호, 비밀번호는 필수입니다.' });
      }

      // ✅ 중복 확인 (undefined 조건 제거하여 Prisma 오류 방지)
      const orConditions = [];
      if (email) orConditions.push({ email });
      if (phone) orConditions.push({ phone });

      let existingUser = null;
      if (orConditions.length > 0) {
        existingUser = await prisma.user.findFirst({
          where: {
            OR: orConditions
          }
        });
      }

      if (existingUser) {
        return res.status(400).json({ error: '이미 등록된 사용자입니다.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ SNS 링크 파싱
      let socialLinks = null;
      if (snsLinks) {
        try {
          socialLinks = JSON.parse(snsLinks);
        } catch (e) {
          return res.status(400).json({ error: 'SNS 링크 형식이 잘못되었습니다.' });
        }
      }

      // ✅ 파일 이름 추출 (필요시 실제 경로/URL로 확장 가능)
      const files = req.files || {};
      const getFileName = (name) => (files[name]?.[0]?.originalname || null);

      const user = await prisma.user.create({
        data: {
          email: email || null,
          phone: phone || null,
          password: hashedPassword,
          role: role === 'pro_influencer' ? 'influencer' : role,
          isAdvanced: isAdvanced === 'true',
          socialLinks,
          businessLicense: getFileName('businessLicense'),
          bankBook: getFileName('bankBook') || getFileName('bankCopy'),
          commerceCertificate: getFileName('commerceCertificate'),
          idCard: getFileName('idCard')
        }
      });

      res.status(201).json({ message: '회원가입 성공', userId: user.id });
    } catch (err) {
      console.error('회원가입 오류:', err);
      res.status(500).json({ error: '서버 오류 발생' });
    }
  }
);

/**
 * ✅ 로그인
 * - 이메일 또는 전화번호로 로그인
 * - bcrypt 비밀번호 확인
 * - JWT 발급
 */
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '2h'
    });

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdvanced: user.isAdvanced
      }
    });
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
