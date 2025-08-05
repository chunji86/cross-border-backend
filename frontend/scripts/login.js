import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailOrPhoneInput = document.getElementById('emailOrPhone');
  const passwordInput = document.getElementById('password');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOrPhone = emailOrPhoneInput.value.trim();
    const password = passwordInput.value.trim();

    if (!emailOrPhone || !password) {
      alert('이메일(또는 전화번호)와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const res = await api.post('/api/auth/login', { emailOrPhone, password });
      auth.saveToken(res.token);
      auth.saveUser(res.user);
      localStorage.setItem('loginTimestamp', Date.now());

      const role = res.user.role;
      if (role === 'admin') {
        window.location.href = '/frontend/pages/admin-dashboard.html';
      } else if (role === 'vendor') {
        window.location.href = '/frontend/pages/vendor-dashboard.html';
      } else if (role === 'premium' || role === 'influencer') {
        window.location.href = '/frontend/pages/myshop-view.html';
      } else {
        window.location.href = '/frontend/pages/shop.html';
      }
    } catch (err) {
      alert('로그인 실패: ' + (err.message || '서버 오류'));
    }
  });
});
