import { get } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('productId');

  const productTitleEl = document.getElementById('product-title');
  const productPriceEl = document.getElementById('product-price');
  const productImageEl = document.getElementById('product-image');
  const productDescriptionEl = document.getElementById('product-description');
  const addToCartBtn = document.getElementById('add-to-cart-btn');

  try {
    const product = await get(`/api/products/${productId}`);

    // 상품 정보 표시
    productTitleEl.textContent = product.title;
    productPriceEl.textContent = `${product.price.toLocaleString()}원`;
    productImageEl.src = product.imageUrl;
    productDescriptionEl.textContent = product.description;

    // 장바구니 담기 기능
    addToCartBtn.addEventListener('click', () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];

      const existingItem = cart.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      alert('장바구니에 상품이 담겼습니다!');
    });

  } catch (error) {
    console.error('상품 정보 로딩 오류:', error);
    alert('상품 정보를 불러오는 데 실패했습니다.');
  }
});
