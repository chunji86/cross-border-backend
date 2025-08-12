// routes/_ops.js
const express = require('express');
const router = express.Router();
router.get('/health', (req,res)=>res.json({ ok:true, time:new Date().toISOString() }));
router.get('/env-check', (req,res)=>res.json({
  cafe24: {
    client_id: !!process.env.CAFE24_CLIENT_ID,
    redirect_uri: process.env.CAFE24_REDIRECT_URI ? 'set' : 'missing',
    api_version: process.env.CAFE24_API_VERSION || 'default(2025-06-01)',
  },
  allowed_malls: (process.env.ALLOWED_MALL_IDS||'').split(',').filter(Boolean),
}));
module.exports = router;
