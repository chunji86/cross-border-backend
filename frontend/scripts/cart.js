document.addEventListener('DOMContentLoaded', () => {
  const cartListEl = document.getElementById('cart-list');
  const totalPriceEl = document.getElementById('total-price');
  const orderBtn = document.getElementById('order-btn');

  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  function renderCart() {
    if (cart.length === 0) {
      cartListEl.innerHTML = '<p class="text-gray-600">장바구니가 비어 있습니다.</p>';
      totalPriceEl.textContent = '총 합계: 0원';
      return;
    }

    cartListEl.innerHTML = cart.map((item, index) => `
      <div class="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <img src="${item.imageUrl}" alt="${item.name}" class="w-20 h-20 object-cover rounded" />
          <div>
            <h3 class="text-lg font-semibold">${item.name}</h3>
            <p class="text-sm text-gray-600">${item.price.toLocaleString()}원</p>
            <div class="mt-2 flex items-center space-x-2">
              <button onclick="updateQuantity(${index}, -1)" class="px-2 py-1 bg-gray-200 rounded">-</button>
              <span>${item.quantity}</span>
              <button onclick="updateQuantity(${index}, 1)" class="px-2 py-1 bg-gray-200 rounded">+</button>
            </div>
          </div>
        </div>
        <button onclick="removeItem(${index})" class="text-red-500 hover:underline">삭제</button>
      </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalPriceEl.textContent = `총 합계: ${total.toLocaleString()}원`;
  }

  window.updateQuantity = (index, change) => {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
  };

  window.removeItem = (index) => {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
  };

  orderBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인 후 주문할 수 있습니다.');
      window.location.href = '/frontend/pages/login.html';
      return;
    }

    if (cart.length === 0) {
      alert('장바구니가 비어 있습니다.');
      return;
    }

    const orderItems = cart.map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    try {
      const res = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: orderItems })
      });

      const data = await res.json();
      if (data.success) {
        alert('주문이 완료되었습니다!');
        localStorage.removeItem('cart');
        window.location.href = '/frontend/pages/shop.html';
      } else {
        alert(data.error || '주문 실패');
      }
    } catch (err) {
      console.error('주문 오류:', err);
      alert('서버 오류');
    }
  });

  renderCart();
});
