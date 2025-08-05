// frontend/scripts/include.js
import { auth } from './auth.js';

export async function loadPartials() {
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();

  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const usernameSpan = document.getElementById('username');

  const user = auth.getUser();

  // ✅ 로그인된 상태에서만 토큰 유효성 검사
  if (user && auth.isTokenExpired()) {
    auth.logout();
    // ❌ location.reload(); // 새로고침 제거
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
