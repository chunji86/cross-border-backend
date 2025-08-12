const express = require('express');
const router = express.Router();
const { ensureAccessToken, callCafe24 } = require('../../utils/cafe24Client');

// ✅ 토큰 확인
router.get('/test', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
    const token = await ensureAccessToken(mall_id);
    return res.json({ ok: true, mall_id, shop_no, has_token: !!token });
  } catch (err) {
    return res.status(500).json({ error: '토큰 확인 실패', detail: err.message });
  }
});

// ✅ 상품 목록 조회
router.get('/products', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
    const limit = Number(req.query.limit || 20);
    const page = Number(req.query.page || 1);
    const data = await callCafe24(mall_id, '/api/v2/admin/products', {
      method: 'GET',
      params: { limit, page },
      shopNo: shop_no,
    });
    return res.json({ ok: true, mall_id, shop_no, count: data?.products?.length || 0, data });
  } catch (err) {
    return res.status(500).json({ error: '상품 목록 조회 실패', detail: err.response?.data || err.message });
  }
});

module.exports = router;
