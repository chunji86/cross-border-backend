// 아주 경량: rc 파라미터를 쿠키에 보관하고, 주문서에 전달하는 역할
(function(){
  try {
    const params = new URLSearchParams(location.search);
    const rc = params.get('rc');
    if (rc) {
      const expires = new Date(Date.now() + 7*24*3600*1000).toUTCString();
      document.cookie = `rc=${encodeURIComponent(rc)}; path=/; expires=${expires}; SameSite=Lax`;
      // 콘솔 확인용
      console.debug('[widget] rc saved', rc);
    }
  } catch(e) { console.warn('[widget] rc save fail', e); }
})();
