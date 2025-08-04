// 📁 frontend/scripts/myshop-delete.js
import API from '../assets/api.js';

document.addEventListener('DOMContentLoaded', () => {
  const deleteButtons = document.querySelectorAll('.delete-button');

  deleteButtons.forEach((button) => {
    button.addEventListener('click', async (e) => {
      const productId = e.target.dataset.productId;

      if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;

      try {
        const res = await API.delete(`/api/influencer-products/${productId}`);
        if (res.message) {
          alert('삭제되었습니다.');
          window.location.reload();
        } else {
          alert(res.error || '삭제 중 오류 발생');
        }
      } catch (err) {
        console.error('삭제 오류:', err);
        alert('서버 오류');
      }
    });
  });
});
