const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const router = express.Router();

// ✅ mall_id별 access_token 기반 상품 목록 조회
router.get('/products', async (req, res) => {
  const mall_id = req.query.mall_id;

  if (!mall_id) {
    return res.status(400).json({ error: 'mall_id는 필수입니다.' });
  }

  try {
    const tokenPath = path.join(__dirname, '../../tokens', `${mall_id}_token.json`);

    if (!fs.existsSync(tokenPath)) {
      return res.status(404).json({ error: `토큰 파일이 존재하지 않습니다: ${mall_id}_token.json` });
    }

    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    const accessToken = tokenData.access_token;

    const apiUrl = `https://${mall_id}.cafe24api.com/api/v2/admin/products`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error(`[ERROR] 상품 목록 조회 실패:`, err.message);
    res.status(500).json({
      error: '상품 목록 조회 실패',
      message: err.message,
    });
  }
});

module.exports = router;
