// frontend/scripts/login.js

import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOrPhone = form.emailOrPhone.value.trim();
    const password = form.password.value;

    if (!emailOrPhone || !password) {
      alert('아이디 또는 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const res = await api.post('/api/auth/login', { emailOrPhone, password });
      auth.saveToken(res.token);
      auth.saveUser(res.user);

      // ✅ 로그인 후 공통 페이지로 이동 (고객용 shop.html)
      window.location.href = '/frontend/pages/shop.html';
    } catch (err) {
      alert('로그인 실패: ' + err.message);
    }
  });
});
