// frontend/scripts/login.js
import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOrPhone = document.getElementById('emailOrPhone').value.trim();
    const password = document.getElementById('password').value;

    if (!emailOrPhone || !password) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const res = await api.post('/api/auth/login', { emailOrPhone, password });

      if (res.token) {
        auth.saveToken(res.token);
        auth.saveUser(res.user);
        alert('로그인 성공!');
        window.location.href = '/frontend/pages/shop.html';
      } else {
        alert(res.message || '로그인 실패');
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      alert('서버 오류로 로그인에 실패했습니다.');
    }
  });
});
