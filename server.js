// server.js (최신본)
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// ──────────────────────────────────────────────
// 기본 미들웨어
// ──────────────────────────────────────────────
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// (선택) 프록시 환경에서 신뢰 설정이 필요하면 주석 해제
// app.set('trust proxy', true);

// ──────────────────────────────────────────────
// 정적 파일 & 대시보드 라우팅
// ──────────────────────────────────────────────
// /public 하위의 정적 자산 제공 (CSS/이미지/단일 HTML 등)
app.use('/public', express.static(path.join(__dirname, 'public')));

// 공급사/인플루언서/관리자 대시보드 진입 경로
app.get('/dashboard/supplier',   (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'supplier.html'));
});
app.get('/dashboard/influencer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'influencer.html'));
});
app.get('/dashboard/admin',      (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'admin.html'));
});

// ──────────────────────────────────────────────
// API 라우트 마운트
// ──────────────────────────────────────────────
try {
  app.use('/api/cafe24', require('./routes/cafe24')); // routes/cafe24/index.js
  console.log('✅ Cafe24 routes mounted at /api/cafe24');
} catch (e) {
  console.error('❌ Failed to mount /api/cafe24:', e.message);
}

try {
  app.use('/api/app', require('./routes/app')); // routes/app/index.js
  console.log('✅ App routes mounted at /api/app');
} catch (e) {
  console.warn('⚠️ /api/app routes not mounted (optional):', e.message);
}

// ──────────────────────────────────────────────
// 헬스체크 & 유틸
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get('/api/env-check', (req, res) => {
  // 비밀값은 그대로 노출하지 않고 "존재 여부"만 리턴
  const required = [
    'CAFE24_CLIENT_ID',
    'CAFE24_CLIENT_SECRET',
    'CAFE24_REDIRECT_URI',
    'CAFE24_SCOPE',
    'CAFE24_API_VERSION',
    'DATA_DIR',
  ];
  const present = {};
  required.forEach(k => { present[k] = !!process.env[k]; });

  res.json({
    ok: true,
    node: process.version,
    env_present: present,
  });
});

// 루트 안내
app.get('/', (req, res) => {
  res.json({
    ok: true,
    where: '/',
    dashboards: {
      supplier:   '/dashboard/supplier',
      influencer: '/dashboard/influencer',
      admin:      '/dashboard/admin',
    },
    apis: {
      cafe24: '/api/cafe24',
      app:    '/api/app',
      health: '/api/health',
    },
  });
});

// ──────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
