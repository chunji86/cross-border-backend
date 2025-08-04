// 📁 frontend/scripts/myshop-view.js

import API from '../assets/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('productList');

  try {
    const res = await API.get('/api/influencer-products/myshop');
    const products = res.products || [];

    if (products.length === 0) {
      container.innerHTML = '<p>마이샵에 등록된 상품이 없습니다.</p>';
      return;
    }

    container.innerHTML = products.map(p => `
      <div class="product-card">
        <img src="${p.imageUrl}" alt="${p.title}" />
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <p><strong>${p.price.toLocaleString()}원</strong></p>
        <button class="copy-link-btn" data-product-id="${p.originalProductId}">공유 링크 복사</button>
      </div>
    `).join('');

    document.querySelectorAll('.copy-link-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const productId = e.target.dataset.productId;
        try {
          const res = await API.post('/api/promotion-links/generate', { productId });
          const { url } = res;
          await navigator.clipboard.writeText(url);
          alert('공유 링크가 복사되었습니다!');
        } catch (err) {
          alert('링크 생성 실패');
          console.error(err);
        }
      });
    });
  } catch (err) {
    container.innerHTML = '<p>상품을 불러오는 중 오류가 발생했습니다.</p>';
    console.error(err);
  }
});
