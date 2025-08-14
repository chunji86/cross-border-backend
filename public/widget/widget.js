(function() {
  function getParameterByName(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  const rc = getParameterByName('rc');
  if (rc) {
    document.cookie = `rc=${rc}; path=/; max-age=${30*24*60*60}`;
    console.log('✅ 리워드 코드 저장:', rc);
  }
})();
