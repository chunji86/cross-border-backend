// ✅ server.js (최신 통합본)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

// ✅ 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ 정적 파일 경로 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/styles', express.static(path.join(__dirname, 'frontend/styles')));
app.use('/scripts', express.static(path.join(__dirname, 'frontend/scripts')));
app.use('/pages', express.static(path.join(__dirname, 'frontend/pages')));
app.use('/assets', express.static(path.join(__dirname, 'frontend/assets')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/partials', express.static(path.join(__dirname, 'frontend/partials')));


// ✅ 라우터 연결
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


// ✅ 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
