const { saveLink, getLinkByCode, saveClick } = require('../../utils/linkStore');

// 코드 생성(공급사 API에서 사용)
function createLink(mall_id, shop_no, { product_no, influencer_id, campaign=null }) {
  return saveLink(mall_id, shop_no, { product_no, influencer_id, campaign });
}

// 리다이렉트 핸들러 (테스트용: /api/app/go/:code)
async function redirectByCode(req, res) {
  const code = req.params.code;
  const mall_id = req.query.mall_id || null; // 선택: 명시 안 하면 link에 저장된 mall_id 사용
  const link = getLinkByCode(code);
  if (!link) return res.status(404).send('Invalid code');

  // 클릭 저장
  saveClick(link.mall_id, link.shop_no, { code, ua: req.headers['user-agent'] || '', referer: req.headers.referer || '' });

  // Cafe24 기본 상품 상세 URL (커스텀 도메인 쓰면 env에서 바꿔도 됨)
  const base = process.env.PUBLIC_STORE_BASE || `https://${link.mall_id}.cafe24.com`;
  const target = `${base}/product/detail.html?product_no=${link.product_no}&utm_source=influencer&utm_medium=link&utm_campaign=${encodeURIComponent(link.campaign||'default')}&rc=${encodeURIComponent(code)}`;
  return res.redirect(302, target);
}

module.exports = { createLink, redirectByCode };
