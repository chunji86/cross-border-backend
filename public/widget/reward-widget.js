// public/widget/reward-widget.js
(function(){
  const mall_id = location.hostname.split('.')[0];
  const shop_no = (new URLSearchParams(location.search).get('shop_no')) || '1';

  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v));
    if (text) e.textContent = text;
    return e;
  }

  async function getJSON(url) {
    const r = await fetch(url, { credentials:'include' });
    return r.json();
  }

  // product_no를 페이지에서 추출하는 로직은 몰 스킨 구조에 맞게 조정 필요
  function guessProductNo() {
    const m = location.pathname.match(/\/product\/.*?\/(\d+)/);
    if (m) return m[1];
    const alt = new URLSearchParams(location.search).get('product_no');
    return alt || '';
  }

  async function init(){
    const product_no = guessProductNo();
    if (!product_no) return;

    const box = el('div', { style: 'position:fixed;right:16px;bottom:16px;padding:12px 14px;background:#111827;color:#fff;border-radius:12px;z-index:99999;box-shadow:0 8px 20px rgba(0,0,0,.25);font-size:14px;' });
    const rateResp = await getJSON(`/api/app/public/product-reward?mall_id=${encodeURIComponent(mall_id)}&shop_no=${encodeURIComponent(shop_no)}&product_no=${encodeURIComponent(product_no)}`);
    const rate = rateResp?.reward_rate ?? 0;

    const title = el('div', null, `이 상품 공유 리워드: ${(rate*100).toFixed(0)}%`);
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    box.appendChild(title);

    // 내 상태 확인 → 인플루언서 승인자면 공유버튼 노출
    try {
      const me = await getJSON('/api/roles/me');
      if (me?.user?.status === 'approved' && me?.user?.role === 'influencer') {
        const btn = el('button', { style: 'font-size:13px;padding:8px 10px;border-radius:10px;border:0;background:#3b82f6;color:#fff;cursor:pointer' }, '내 공유링크 복사');
        btn.onclick = async () => {
          const r = await getJSON('/api/roles/my-share-link?path='+encodeURIComponent(location.pathname + location.search));
          if (r.ok && r.url) {
            await navigator.clipboard.writeText(r.url);
            btn.textContent = '복사 완료!';
            setTimeout(()=> btn.textContent='내 공유링크 복사', 1500);
          }
        };
        box.appendChild(btn);
      } else {
        const a = el('a', { href: `/public/roles/apply.html?mall_id=${encodeURIComponent(mall_id)}&shop_no=${encodeURIComponent(shop_no)}`, style:'color:#a5b4fc;text-decoration:underline' }, '인플루언서 신청');
        box.appendChild(a);
      }
    } catch {
      const a = el('a', { href: `/public/roles/apply.html?mall_id=${encodeURIComponent(mall_id)}&shop_no=${encodeURIComponent(shop_no)}`, style:'color:#a5b4fc;text-decoration:underline' }, '로그인/신청');
      box.appendChild(a);
    }

    document.body.appendChild(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
