import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const deleteButtons = document.querySelectorAll('.delete-btn');
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

  deleteButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmed = confirm('정말로 이 상품을 삭제하시겠습니까?');
      if (!confirmed) return;

      const influencerProductId = btn.dataset.id;

      try {
        await api.del(`/api/influencer-products/${influencerProductId}`);
        alert('삭제가 완료되었습니다.');
        window.location.reload();
      } catch (err) {
        console.error('삭제 실패:', err);
        alert('삭제에 실패했습니다: ' + err.message);
      }
    });
  });
});
