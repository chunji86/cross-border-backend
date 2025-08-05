// frontend/scripts/login.js
import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const messageBox = document.getElementById('message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOrPhone = form.emailOrPhone.value.trim();
    const password = form.password.value;

    if (!emailOrPhone || !password) {
      showMessage('이메일/전화번호와 비밀번호를 모두 입력하세요.', 'error');
      return;
    }

    try {
      const res = await api.post('/auth/login', { emailOrPhone, password });

      if (res.token) {
        auth.saveToken(res.token);
        auth.saveUser(res.user);

        showMessage('로그인 성공!', 'success');
        setTimeout(() => {
          window.location.href = '/frontend/pages/shop.html';
        }, 1000);
      } else {
        showMessage('로그인 실패: 토큰이 없습니다.', 'error');
      }
    } catch (err) {
      const error = err?.response?.data?.error || '로그인 중 오류가 발생했습니다.';
      showMessage(`로그인 실패: ${error}`, 'error');
    }
  });

  function showMessage(text, type) {
    if (messageBox) {
      messageBox.textContent = text;
      messageBox.style.color = type === 'error' ? 'red' : 'green';
    }
  }
});
