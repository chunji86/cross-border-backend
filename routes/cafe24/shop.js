// routes/cafe24/shop.js
const express = require('express');
const router = express.Router();
const { ensureAccessToken, callCafe24 } = require('../../utils/cafe24Client');

// ✅ 헬스체크/토큰 확인
router.get('/test', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const token = await ensureAccessToken(mall_id);
    return res.json({ ok: true, mall_id, shop_no, has_token: !!token });
  } catch (err) {
    console.error('[/api/cafe24/shop/test] error:', err.message);
    return res.status(500).json({ error: '토큰 확인 실패', detail: err.message });
  }
});

// ✅ 강제 리프레시 테스트(선택): 실제 만료전에도 refresh 동작 점검
router.post('/refresh', async (req, res) => {
  try {
    const { mall_id } = req.body;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    // ensureAccessToken은 만료가 아니면 refresh 하지 않음.
    // 테스트를 위해 내부 토큰 파일의 expires_at을 과거로 수정하고 다시 호출하거나,
    // 여기선 한 번 호출하여 정상 동작만 확인.
    const token = await ensureAccessToken(mall_id);
    return res.json({ ok: true, mall_id, token_preview: token ? token.slice(0, 12) + '...' : null });
  } catch (err) {
    return res.status(500).json({ error: '강제 리프레시 테스트 실패', detail: err.message });
  }
});

// ✅ 상품 목록 조회 (Admin API)
// 참고: GET /api/v2/admin/products
router.get('/products', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    // limit, page 등 쿼리 반영
    const limit = Number(req.query.limit || 20);
    const page = Number(req.query.page || 1);

    const data = await callCafe24(mall_id, '/api/v2/admin/products', {
      method: 'GET',
      params: { limit, page },
      shopNo: shop_no,
    });

    return res.json({ ok: true, mall_id, shop_no, count: data?.products?.length || 0, data });
  } catch (err) {
    console.error('[/api/cafe24/shop/products] error:', err.response?.data || err.message);
    const detail = err.response?.data || err.message;
    return res.status(500).json({ error: '상품 목록 조회 실패', detail });
  }
});

module.exports = router;
