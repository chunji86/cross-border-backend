// frontend/scripts/navbar.js

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  let menuHTML = '';

  if (token && role) {
    // ✅ 로그인된 상태
    switch (role) {
      case 'vendor':
        menuHTML = `
          <a href="/frontend/pages/vendor_add_product.html">상품 등록</a>
          <a href="/frontend/pages/logout.html" onclick="logout()">로그아웃</a>
        `;
        break;
      case 'influencer':
        menuHTML = `
          <a href="/frontend/pages/myshop-view.html">마이샵</a>
          <a href="/frontend/pages/logout.html" onclick="logout()">로그아웃</a>
        `;
        break;
      case 'customer':
        menuHTML = `
          <a href="/frontend/pages/shop.html">쇼핑몰</a>
          <a href="/frontend/pages/logout.html" onclick="logout()">로그아웃</a>
        `;
        break;
      case 'admin':
        menuHTML = `
          <a href="/frontend/pages/admin-dashboard.html">관리자 대시보드</a>
          <a href="/frontend/pages/logout.html" onclick="logout()">로그아웃</a>
        `;
        break;
      default:
        menuHTML = `<a href="/frontend/pages/logout.html" onclick="logout()">로그아웃</a>`;
    }
  } else {
    // ✅ 비로그인 상태
    menuHTML = `
      <a href="/frontend/pages/login.html">로그인</a>
      <a href="/frontend/pages/signup.html">회원가입</a>
    `;
  }

  if (navbar) navbar.innerHTML = menuHTML;
});

// ✅ 로그아웃 함수
function logout() {
  localStorage.clear();
  alert('로그아웃 되었습니다.');
  window.location.href = '/frontend/pages/login.html';
}
