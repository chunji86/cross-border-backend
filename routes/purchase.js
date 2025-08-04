const express = require('express');
const router = express.Router();
const db = require('../db'); // SQLite 연결

router.post('/', (req, res) => {
  const { productId, price, ref } = req.body;

  if (!productId || !price || !ref) {
    return res.status(400).json({ error: 'productId, price, ref는 필수입니다.' });
  }

  const reward = Math.floor(price * 0.1); // 10% 리워드 계산

  // DB에 리워드 저장
  const query = `INSERT INTO influencer_rewards (ref, amount) VALUES (?, ?)`;
  db.run(query, [ref, reward], function (err) {
    if (err) {
      console.error('DB 저장 실패:', err);
      return res.status(500).json({ error: 'DB 저장 실패' });
    }

    res.json({
      message: '구매 완료',
      rewardGivenTo: ref,
      rewardAmount: reward,
      dbId: this.lastID
    });
  });
});

module.exports = router;
