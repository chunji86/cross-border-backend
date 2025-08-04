// frontend/scripts/include.js

import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 공통 헤더/푸터 동적 삽입
  await includeHTML();

  // 로그인 상태에 따른 메뉴 표시 변경
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const usernameSpan = document.getElementById('username');

  const user = auth.getUser();

  if (auth.isTokenExpired()) {
    auth.logout();
    location.reload();
    return;
  }

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (usernameSpan) usernameSpan.textContent = `${user.name || user.email}`;
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (signupBtn) signupBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (usernameSpan) usernameSpan.textContent = '';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
      location.href = '/frontend/pages/login.html';
    });
  }
});

// 공통 HTML 포함 함수
async function includeHTML() {
  const header = document.querySelector('[data-include="header"]');
  const footer = document.querySelector('[data-include="footer"]');

  if (header) {
    const res = await fetch('/frontend/partials/header.html');
    header.innerHTML = await res.text();
  }

  if (footer) {
    const res = await fetch('/frontend/partials/footer.html');
    footer.innerHTML = await res.text();
  }
}
