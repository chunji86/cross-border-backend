const express = require('express');
const router = express.Router();
const { resolveMemberNo } = require('../services/memberResolver');

router.post('/resolve-member', async (req, res) => {
  try {
    const { mall_id, shop_no, identifier, id_type } = req.body || {};
    if (!mall_id || !identifier) return res.status(400).json({ ok:false, error:'missing mall_id/identifier' });
    const member_no = await resolveMemberNo({ mall_id, shop_no, rawId: identifier, id_type });
    return res.json({ ok:true, member_no });
  } catch (e) {
    return res.status(400).json({ ok:false, error: e.message });
  }
});

module.exports = router;
