// routes/cafe24/callback.js
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  console.log('📦 Cafe24 Webhook Received:', req.body);
  res.status(200).send('OK');
});

module.exports = router;
