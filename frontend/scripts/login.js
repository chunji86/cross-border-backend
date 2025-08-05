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
      // ✅ 정확한 API 경로로 수정
      const res = await api.post('/api/auth/login', { emailOrPhone, password });

      if (res.token) {
        auth.saveUser({ ...res.user, token: res.token });  // ✅ 토큰 포함 저장

        showMessage('로그인 성공!', 'success');
        setTimeout(() => {
          window.location.href = '/frontend/pages/shop.html';
        }, 1000);
      } else {
        showMessage('로그인 실패: 토큰이 없습니다.', 'error');
      }
    } catch (err) {
      showMessage(`로그인 실패: ${err.message}`, 'error');
    }
  });

  function showMessage(text, type) {
    if (messageBox) {
      messageBox.textContent = text;
      messageBox.style.color = type === 'error' ? 'red' : 'green';
    }
  }
});
