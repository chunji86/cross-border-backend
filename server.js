require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

/* -------------------- 기본 미들웨어 -------------------- */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

/* -------------------- 정적 경로 -------------------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/styles', express.static(path.join(__dirname, 'frontend/styles')));
app.use('/scripts', express.static(path.join(__dirname, 'frontend/scripts')));
app.use('/pages', express.static(path.join(__dirname, 'frontend/pages')));
app.use('/assets', express.static(path.join(__dirname, 'frontend/assets')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/partials', express.static(path.join(__dirname, 'frontend/partials')));

/* -------------------- API 라우터 (순서 중요) -------------------- */
// ✅ 카페24 라우터 “단 한 번”만 마운트
app.use('/api/cafe24', require('./routes/cafe24'));
console.log('✅ Cafe24 routes mounted at /api/cafe24');
app.use('/api', require('./routes/_ops')); // /api/health, /api/env-check

// ✅ /api/cafe24 핑(404 진단용 고정 엔드포인트)
app.get('/api/cafe24', (req, res) =>
  res.json({ ok: true, where: '/api/cafe24', from: 'server.js' })
);

// 나머지 기존 API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/promotion-links', require('./routes/promotionLinks'));
app.use('/api/myshop-view', require('./routes/myshopView'));
app.use('/api/influencer-products', require('./routes/influencerProducts'));
app.use('/api/click', require('./routes/clickTracker'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin/products', require('./routes/adminProducts'));
app.use('/api/admin/withdrawals', require('./routes/adminWithdrawals'));
app.use('/api/commissions', require('./routes/commissions'));
app.use('/api/purchase', require('./routes/purchase'));


/* -------------------- 루트 페이지 -------------------- */
app.get('/', (req, res) => {
  res.send('🎉 라쿤글로벌 백엔드가 정상 작동 중입니다!');
});

/* -------------------- 서버 시작 -------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
