require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();



// ✅ 루트 경로 응답 추가
app.get('/', (req, res) => {
  res.send('🎉 라쿤글로벌 카페24 앱이 정상 작동 중입니다!');
});

// (기존 라우터 설정 등은 유지)


// ✅ 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ 정적 파일 경로
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/styles', express.static(path.join(__dirname, 'frontend/styles')));
app.use('/scripts', express.static(path.join(__dirname, 'frontend/scripts')));
app.use('/pages', express.static(path.join(__dirname, 'frontend/pages')));
app.use('/assets', express.static(path.join(__dirname, 'frontend/assets')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/partials', express.static(path.join(__dirname, 'frontend/partials')));

// ✅ API 라우터 등록 (💡순서 중요)
const cafe24ShopRouter = require('./routes/cafe24/shop');          // 💡 먼저 연결
const cafe24Routes = require('./routes/cafe24');
const cafe24SyncRouter = require('./routes/cafe24Sync');
const testRoutes = require('./routes/test');
const saveProductsRouter = require('./routes/cafe24/saveProducts');
const cafe24TokenDebug = require('./routes/cafe24/tokenDebug');

const authRoutes = require('./routes/auth');
const rewardRoutes = require('./routes/rewards');
const withdrawalRoutes = require('./routes/withdrawals');
const promotionLinksRoutes = require('./routes/promotionLinks');
const myShopViewRoutes = require('./routes/myshopView');
const influencerProductsRoutes = require('./routes/influencerProducts');
const clickTrackerRoutes = require('./routes/clickTracker');
const orderRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const adminProductsRoutes = require('./routes/adminProducts');
const adminWithdrawalsRoutes = require('./routes/adminWithdrawals');
const commissionsRoutes = require('./routes/commissions');
const purchaseRoutes = require('./routes/purchase');

// ✅ 실제 API 라우터 사용
app.use('/api/cafe24', require('./routes/cafe24'));
app.use('/api/cafe24/shop', cafe24ShopRouter);  // 💡 먼저 선언
app.use('/api/cafe24', cafe24Routes);
app.use('/api/cafe24', cafe24SyncRouter);
app.use('/api/cafe24-sync', cafe24SyncRouter);
app.use('/api/test', testRoutes);
app.use('/api/cafe24/save-products', saveProductsRouter);
app.use('/api/cafe24/token', cafe24TokenDebug);

console.log('✅ Cafe24 routes mounted at /api/cafe24'); 
// 디버그: 등록된 라우트를 확인하기 위한 엔드포인트
app.get('/__routes', (req, res) => {
  const routes = [];

  function add(path, layer) {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods)
        .filter(m => layer.route.methods[m])
        .map(m => m.toUpperCase());
      routes.push({ path: path + layer.route.path, methods });
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(nested => add(path + (layer.regexp?.fast_slash ? '' : ''), nested));
    }
  }

  app._router.stack.forEach(layer => {
    if (layer.name === 'router' && layer.handle.stack) {
      // 마운트된 경로(prefix)
      const prefix = layer.regexp?.fast_slash ? '' : (layer.regexp?.source || '');
    }
  });

  // 간단 버전: Express 4에서 prefix까지 적출하기 복잡하므로, 문자열로 찍습니다.
  const stack = app._router.stack
    .map(l => l.route ? { path: l.route.path, methods: Object.keys(l.route.methods)} : l.name)
  res.json({ ok: true, note: '간단 덤프', stack });
});



app.use('/api/auth', authRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/promotion-links', promotionLinksRoutes);
app.use('/api/myshop-view', myShopViewRoutes);
app.use('/api/influencer-products', influencerProductsRoutes);
app.use('/api/click', clickTrackerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalsRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/purchase', purchaseRoutes);


// ✅ 서버 실행
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
