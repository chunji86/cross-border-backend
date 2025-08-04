import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-myshop-form');
  const logoutBtn = document.getElementById('logout-btn');
  const usernameSpan = document.getElementById('username');

  const user = auth.getUser();
  if (!user || user.role !== 'influencer') {
    alert('고급 인플루언서만 접근 가능합니다.');
    window.location.href = '/frontend/pages/login.html';
    return;
  }

  // 사용자 이름 출력
  if (usernameSpan) {
    usernameSpan.textContent = user.name || user.email || '인플루언서';
  }

  // 로그아웃
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalProductId = document.getElementById('originalProductId').value;
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const imageUrl = document.getElementById('imageUrl').value.trim();
    const price = parseFloat(document.getElementById('price').value);

    if (!originalProductId || !title || !description || !imageUrl || isNaN(price)) {
      alert('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    const data = {
      originalProductId,
      title,
      description,
      imageUrl,
      price
    };

    try {
      await api.post('/api/influencer-products/add', data);
      alert('마이샵에 상품이 등록되었습니다.');
      form.reset();
    } catch (err) {
      console.error('등록 실패:', err);
      alert('등록에 실패했습니다: ' + err.message);
    }
  });
});
