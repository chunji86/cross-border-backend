(function() {
  // ====== 유틸 ======
  function getParameterByName(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  function setCookie(k, v, maxAgeSec) {
    document.cookie = `${k}=${v}; path=/; max-age=${maxAgeSec}; Secure; SameSite=Lax`;
  }
  function getCookie(k) {
    return document.cookie.split('; ').find(x => x.startsWith(k + '='))?.split('=')[1] || null;
  }
  function uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  // ====== 1) rc 쿠키 저장 ======
  const rc = getParameterByName('rc');
  if (rc) {
    setCookie('rc', rc, 30*24*60*60);
    console.log('✅ 리워드 코드 저장:', rc);
  }

  // ====== 2) clientId 쿠키 (세션 식별) ======
  let cid = getCookie('raccoon_cid');
  if (!cid) {
    cid = uuid();
    setCookie('raccoon_cid', cid, 365*24*60*60); // 1년
  }

  // ====== 3) 이벤트 전송 ======
  const BACKEND = 'https://cross-border-backend-dc0m.onrender.com'; // ← 여기에 본인 백엔드 도메인
  const mallId = (new URL(location.href).hostname.split('.')[0]) || ''; // hanfen.cafe24.com → hanfen
  const shopNo = getParameterByName('shop_no') || '1';

  function sendEvent(event, extra) {
    const payload = {
      mallId,
      shopNo,
      rc: getCookie('rc'),
      cid,
      event,               // 'view', 'checkout', 'order_result'
      url: location.href,
      referrer: document.referrer || null,
      ...extra
    };
    // 페이지 이동 중에도 보내지도록 keepalive 사용
    navigator.sendBeacon?.(`${BACKEND}/api/track/rc`, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      || fetch(`${BACKEND}/api/track/rc`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload), keepalive: true })
      .catch(()=>{});
  }

  // 페이지 타입 추정: 경로/쿼리로 간단 식별
  const href = location.href;
  if (/\/order\//i.test(href) || /order=1|cart=1|buy=1/i.test(href)) {
    // 결제/주문서 단계 진입
    sendEvent('checkout');
  }

  // 주문완료 페이지(감지용 후보들: result/complete/thankyou)
  if (/result|complete|thank/i.test(href)) {
    // 카페24는 보통 주문번호가 DOM/URL에 노출됩니다. 못 찾으면 null로 전송 → 백엔드가 근접 매칭
    const orderNoFromUrl = getParameterByName('order_id') || getParameterByName('ord_no') || null;
    sendEvent('order_result', { orderNoHint: orderNoFromUrl });
  }

  // 일반 페이지 뷰도 가볍게 기록(선택)
  sendEvent('view');
})();

window.raccoonWidgetLoaded = true;
