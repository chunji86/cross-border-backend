import { getAuthToken } from '../assets/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const productList = document.getElementById('productList');
  const token = getAuthToken();

  try {
    const res = await fetch('/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const products = await res.json();

    productList.innerHTML = products.map(product => `
      <div class="product-card">
        <img src="/uploads/${product.imageUrl}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p><strong>${product.price.toLocaleString()}원</strong></p>
        <button data-id="${product.id}" class="add-btn">마이샵에 추가</button>
      </div>
    `).join('');

    document.querySelectorAll('.add-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const productId = e.target.dataset.id;

        const res = await fetch('/api/influencer-products/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId })
        });

        const result = await res.json();
        if (res.ok) {
          alert('마이샵에 상품이 추가되었습니다.');
        } else {
          alert(result.error || '오류 발생');
        }
      });
    });
  } catch (err) {
    console.error('상품 조회 오류:', err);
    productList.innerHTML = '<p>상품을 불러오지 못했습니다.</p>';
  }
});
