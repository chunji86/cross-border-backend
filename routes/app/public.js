const express = require('express');
const router = express.Router();
const { getProductRate, getDefaultRate } = require('../../utils/rewardStore'); // 이미 있으신 유틸을 가정

// GET /api/app/public/product-reward?mall_id=hanfen&shop_no=1&product_no=45
router.get('/product-reward', (req, res) => {
  const { mall_id, shop_no = '1', product_no } = req.query;
  if (!mall_id || !product_no) return res.status(400).json({ error: 'missing mall_id/product_no' });

  const def = getDefaultRate(mall_id, shop_no) ?? 0.1;
  const prod = getProductRate(mall_id, shop_no, product_no);
  const reward_rate = (prod?.rate ?? def); // 소수(0.1=10%)
  res.json({ ok: true, reward_rate });
});

module.exports = router;
