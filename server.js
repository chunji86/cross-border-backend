// server.js (final safe version)
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// ──────────────────────────────────────────────
// 기본 미들웨어
// ──────────────────────────────────────────────
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
// app.set('trust proxy', true); // 프록시 환경이면 주석 해제

// ──────────────────────────────────────────────
// CORS (함수 기반 화이트리스트)
// ──────────────────────────────────────────────
const ALLOW_LIST = [
  /\.cafe24\.com$/,                           // 모든 cafe24 서브도메인 허용
  'https://hanfen.cafe24.com',                // 사용 중인 쇼핑몰
  process.env.PUBLIC_BACKEND_ORIGIN || ''     // 백엔드 도메인(옵션)
  // 예: https://cross-border-backend-dc0m.onrender.com
];

function checkOrigin(origin) {
  if (!origin) return true; // 서버-서버 호출(Postman/curl 등)
  return ALLOW_LIST.some(rule =>
    rule instanceof RegExp ? rule.test(origin) : rule === origin
  );
}

const corsOptions = {
  origin: (origin, cb) => cb(null, checkOrigin(origin)),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400
};

app.use(cors(corsOptions));
// ⛔ path-to-regexp v8에서 '*' 금지 → 정규식으로 대체
app.options(/.*/, cors(corsOptions));

// ──────────────────────────────────────────────
// 정적 파일 & 대시보드
// ──────────────────────────────────────────────
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

app.get('/dashboard/supplier',   (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'supplier.html'))
);
app.get('/dashboard/influencer', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'influencer.html'))
);
app.get('/dashboard/admin',      (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'admin.html'))
);

// ──────────────────────────────────────────────
/** API 라우트 (listen 이전) */
// ──────────────────────────────────────────────
try {
  app.use('/api/cafe24', require('./routes/cafe24')); // routes/cafe24/index.js
  console.log('✅ Cafe24 routes mounted at /api/cafe24');
} catch (e) {
  console.error('❌ Failed to mount /api/cafe24:', e.message);
}

try {
  app.use('/api/app', require('./routes/app')); // optional
  console.log('✅ App routes mounted at /api/app');
} catch (e) {
  console.warn('⚠️ /api/app routes not mounted (optional):', e.message);
}

try {
  app.use('/api/jobs', require('./routes/jobs')); // 크론/작업
  console.log('✅ Jobs routes mounted at /api/jobs');
} catch (e) {
  console.warn('⚠️ /api/jobs routes not mounted (optional):', e.message);
}

try {
  const trackRouter = require('./routes/track'); // /api/track (rc 이벤트 수신 등)
  app.use('/api/track', trackRouter);
  console.log('✅ Track routes mounted at /api/track');
} catch (e) {
  console.error('❌ Failed to mount /api/track:', e.message);
}

// ──────────────────────────────────────────────
// 헬스체크 & 유틸
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get('/api/env-check', (req, res) => {
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
      track:  '/api/track',
      health: '/api/health',
    },
  });
});

// ──────────────────────────────────────────────
// 서버 시작
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
