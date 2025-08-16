// /public/widget/reward-widget.js  (latest)
(function () {
  // ───────────────────────────────────────────────────────────────
  // 0) 공통 상수/유틸
  // ───────────────────────────────────────────────────────────────
  // 이 스크립트가 로드된 서버(origin)를 API BASE로 사용
  // ex) https://cross-border-backend-xxxxx.onrender.com
  const API_BASE = (function(){
    try {
      // 더 안전하게: 현재 실행 중 스크립트의 src에서 origin 추출
      const s = document.currentScript || (function(){
        const arr = document.getElementsByTagName('script');
        return arr[arr.length - 1];
      })();
      return new URL(s.src).origin;
    } catch (e) {
      // fallback: location.origin (대부분 동일)
      return location.origin;
    }
  })();

  const mall_id = location.hostname.split('.')[0];
  const shop_no = new URLSearchParams(location.search).get('shop_no') || '1';

  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (text != null) e.textContent = text;
    return e;
  }

  // fetch -> 항상 API_BASE 기준으로 호출, CORS credentials 불필요(omit)
  async function getJSON(pathOrUrl) {
    const url = pathOrUrl.startsWith('http')
      ? pathOrUrl
      : `${API_BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
    const r = await fetch(url, { credentials: 'omit' });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { ok:false, raw:t }; }
  }

  // rc= 파라미터 → 30일 쿠키 저장 (HTTPS, SameSite=Lax)
  (function persistRcCookie(){
    try {
      const rc = new URLSearchParams(location.search).get('rc');
      if (!rc) return;
      const days = 30;
      const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
      document.cookie =
        `rc=${encodeURIComponent(rc)}; path=/; expires=${expires}; secure; samesite=lax`;
    } catch (e) { /* noop */ }
  })();

  // product_no 추정 (스킨별로 다를 수 있어 보완용 2안)
  function guessProductNo() {
    const m = location.pathname.match(/\/product\/.*?\/(\d+)/);
    if (m) return m[1];
    const alt = new URLSearchParams(location.search).get('product_no');
    return alt || '';
  }

  // ───────────────────────────────────────────────────────────────
  // 1) 위젯 초기화
  // ───────────────────────────────────────────────────────────────
  async function init() {
    const product_no = guessProductNo();
    if (!product_no) return; // 상품 페이지가 아니면 표시 안 함

    // 플로팅 상자
    const box = el('div', {
      style: [
        'position:fixed', 'right:16px', 'bottom:16px',
        'padding:12px 14px', 'background:#111827', 'color:#fff',
        'border-radius:12px', 'z-index:99999',
        'box-shadow:0 8px 20px rgba(0,0,0,.25)', 'font-size:14px'
      ].join(';')
    });

    // 1) 리워드율 조회
    const rateResp = await getJSON(`/api/app/public/product-reward?mall_id=${encodeURIComponent(mall_id)}&shop_no=${encodeURIComponent(shop_no)}&product_no=${encodeURIComponent(product_no)}`);
    const rate = Number(rateResp?.reward_rate || 0);
    const title = el('div', null, `이 상품 공유 리워드: ${(rate * 100).toFixed(0)}%`);
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    box.appendChild(title);

    // 2) 내 상태 확인 → 버튼 분기
    try {
      const me = await getJSON('/api/roles/me'); // API_BASE 고정
      const isApprovedInfluencer =
        (me?.user?.status === 'approved') &&
        (String(me?.user?.role || '').toLowerCase() === 'influencer');

      if (isApprovedInfluencer) {
        const btn = el('button', {
          style: 'font-size:13px;padding:8px 10px;border-radius:10px;border:0;background:#3b82f6;color:#fff;cursor:pointer'
        }, '내 공유링크 복사');

        btn.onclick = async () => {
          const r = await getJSON('/api/roles/my-share-link?path=' + encodeURIComponent(location.pathname + location.search));
          if (r && r.ok && r.url) {
            try {
              await navigator.clipboard.writeText(r.url);
              btn.textContent = '복사 완료!';
              setTimeout(() => (btn.textContent = '내 공유링크 복사'), 1500);
            } catch {
              // 클립보드가 막힌 환경 대비
              prompt('아래 링크를 복사하세요', r.url);
            }
          }
        };
        box.appendChild(btn);
      } else {
        // 신청 페이지(백엔드 정적 페이지)로 연결
        const applyUrl = `${API_BASE}/public/tools/apply.html?mall_id=${encodeURIComponent(mall_id)}&shop_no=${encodeURIComponent(shop_no)}`;
        const a = el('a', { href: applyUrl, style: 'color:#a5b4fc;text-decoration:underline' }, '인플루언서 신청');
        box.appendChild(a);
      }
    } catch (e) {
      const applyUrl = `${API_BASE}/public/tools/apply.html?mall_id=${encodeURIComponent(mall_id)}&shop_no=${encodeURIComponent(shop_no)}`;
      const a = el('a', { href: applyUrl, style: 'color:#a5b4fc;text-decoration:underline' }, '로그인/신청');
      box.appendChild(a);
    }

    document.body.appendChild(box);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
