document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('로그인이 필요합니다.');
    window.location.href = '/frontend/pages/login.html';
    return;
  }

  try {
    const res = await fetch('/api/products/my', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!data.success) {
      alert('상품 목록을 불러오지 못했습니다.');
      return;
    }

    const productList = document.getElementById('productList');
    data.products.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.description}</td>
        <td>${product.price}</td>
        <td>${product.stock}</td>
        <td>${product.rewardRate * 100}%</td>
      `;
      productList.appendChild(row);
    });
  } catch (error) {
    alert('에러 발생: ' + error.message);
  }
});
