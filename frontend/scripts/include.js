import { auth } from './auth.js';

export async function loadPartials(callback) {
  const headerHTML = await fetch('/partials/header.html').then(res => res.text());
  const footerHTML = await fetch('/partials/footer.html').then(res => res.text());
  document.body.insertAdjacentHTML('afterbegin', headerHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // ✅ 로그인 상태 UI 적용 및 버튼 이벤트 등록
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const usernameSpan = document.getElementById('username');

  const ordersBtn = document.getElementById('orders-btn');
  const recentBtn = document.getElementById('recent-btn');
  const supportBtn = document.getElementById('support-btn');

  const user = auth.getUser();

  if (user) {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    usernameSpan.style.display = 'inline-block';
    usernameSpan.textContent = `${user.name}님`;
  }

  // ✅ 버튼 동작 연결
  if (loginBtn) loginBtn.onclick = () => location.href = 'login.html';
  if (signupBtn) signupBtn.onclick = () => location.href = 'signup.html';
  if (logoutBtn) logoutBtn.onclick = () => {
    auth.logout();
    location.reload();
  };

  if (ordersBtn) ordersBtn.onclick = () => location.href = 'orders.html';
  if (recentBtn) recentBtn.onclick = () => location.href = 'recent.html';
  if (supportBtn) supportBtn.onclick = () => location.href = 'support.html';

  if (callback) callback(); // ✅ 로딩 완료 후 콜백 실행
}
