// public/dashboard/app.js
// 전역 헬퍼: 토큰/요청/유틸
(function () {
  const tokenKeys = ['authToken', 'token'];

  function readCookie(name) {
    const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : '';
  }

  function getStoredToken() {
    for (const k of tokenKeys) {
      const v = localStorage.getItem(k) || readCookie(k);
      if (v) return v;
    }
    return '';
  }

  async function json(url, opts = {}) {
    const headers = Object.assign({}, opts.headers || {});
    // body가 있으면 JSON 헤더 자동 세팅
    if (opts.body && !('Content-Type' in headers)) headers['Content-Type'] = 'application/json';
    // 토큰 자동 첨부
    const token = getStoredToken();
    if (token && !('Authorization' in headers)) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(url, Object.assign({}, opts, { headers }));
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || res.statusText || 'Request failed';
      throw new Error(msg);
    }
    return data;
  }

  function number(n, locale = 'ko-KR') {
    return new Intl.NumberFormat(locale).format(Number(n) || 0);
  }

  function copy(text) {
    return navigator.clipboard.writeText(text);
  }

  function rcLink(baseUrl, influencerId) {
    const u = new URL(baseUrl, location.origin);
    u.searchParams.set('rc', `inf_${influencerId}`);
    return u.toString();
  }

  // 전역 노출
  window.App = {
    json,
    number,
    copy,
    rcLink,
    getToken: getStoredToken
  };
})();
