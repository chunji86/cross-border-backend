import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOrPhone = document.getElementById('emailOrPhone').value;
    const password = document.getElementById('password').value;

    try {
      const res = await api.post('/api/auth/login', { emailOrPhone, password });

      if (res.success) {
        auth.saveUser(res.user);  // ✅ 오류났던 부분 fix됨
        alert('로그인 성공!');
        window.location.href = '/frontend/pages/shop.html';
      } else {
        alert('로그인 실패: ' + res.message);
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      alert('서버 오류로 로그인 실패');
    }
  });
});
