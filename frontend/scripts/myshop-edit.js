import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('edit-myshop-form');
  const logoutBtn = document.getElementById('logout-btn');
  const usernameSpan = document.getElementById('username');

  const user = auth.getUser();
  if (!user || user.role !== 'influencer') {
    alert('고급 인플루언서만 접근 가능합니다.');
    window.location.href = '/frontend/pages/login.html';
    return;
  }

  if (usernameSpan) {
    usernameSpan.textContent = user.name || user.email || '인플루언서';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const influencerProductId = urlParams.get('id');

  if (!influencerProductId) {
    alert('잘못된 접근입니다.');
    return;
  }

  try {
    const product = await api.get(`/api/influencer-products/${influencerProductId}`);

    document.getElementById('title').value = product.title || '';
    document.getElementById('description').value = product.description || '';
    document.getElementById('imageUrl').value = product.imageUrl || '';
    document.getElementById('price').value = product.price || '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const updatedData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        imageUrl: document.getElementById('imageUrl').value.trim(),
        price: parseFloat(document.getElementById('price').value)
      };

      try {
        await api.post(`/api/influencer-products/update/${influencerProductId}`, updatedData);
        alert('상품 정보가 수정되었습니다.');
        window.location.href = '/frontend/pages/myshop-view.html';
      } catch (err) {
        console.error('수정 실패:', err);
        alert('수정에 실패했습니다: ' + err.message);
      }
    });
  } catch (err) {
    console.error('상품 불러오기 실패:', err);
    alert('상품 정보를 불러오는 데 실패했습니다.');
  }
});
