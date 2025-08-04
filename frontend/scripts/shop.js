import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const productContainer = document.getElementById('product-list');
  const categoryBar = document.getElementById('category-bar');
  const filterSelect = document.getElementById('country-filter');
  const sortButtons = document.querySelectorAll('.sort-btn');

  // ✅ 자동 로그아웃 (2시간 후)
  const timestamp = localStorage.getItem('loginTimestamp');
  if (timestamp && Date.now() - parseInt(timestamp) > 2 * 60 * 60 * 1000) {
    auth.logout();
  }

  // ✅ 로그인 상태 UI
  const user = auth.getUser();
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const usernameSpan = document.getElementById('username');

  if (user) {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    usernameSpan.style.display = 'inline-block';
    usernameSpan.textContent = `${user.name}님`;
  }

  // ✅ 버튼 이벤트
  if (loginBtn) loginBtn.onclick = () => location.href = 'login.html';
  if (signupBtn) signupBtn.onclick = () => location.href = 'signup.html';
  if (logoutBtn) logoutBtn.onclick = () => {
    auth.logout();
    location.reload();
  };

  // ✅ 슬라이드 배너
  let slideIndex = 0;
  const slides = document.querySelectorAll('.slide');
  function showSlides() {
    slides.forEach(s => s.style.display = 'none');
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].style.display = 'block';
    setTimeout(showSlides, 3000);
  }
  showSlides();

  // ✅ 상품 데이터 로드
  let allProducts = await api.get('/products');
  renderCategories(allProducts);
  renderProducts(allProducts);

  // ✅ 국가 필터
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      const country = filterSelect.value;
      const filtered = country
        ? allProducts.filter(p => p.shippingCountries.includes(country))
        : allProducts;
      renderProducts(filtered);
    });
  }

  // ✅ 정렬
  sortButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.sort;
      const sorted = [...allProducts];
      if (type === 'low') sorted.sort((a, b) => a.price - b.price);
      if (type === 'high') sorted.sort((a, b) => b.price - a.price);
      if (type === 'new') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderProducts(sorted);
    });
  });

  // ✅ 카테고리 생성
  function renderCategories(products) {
    const categories = [...new Set(products.map(p => p.category))];
    categoryBar.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.onclick = () => {
        const filtered = allProducts.filter(p => p.category === cat);
        renderProducts(filtered);
      };
      categoryBar.appendChild(btn);
    });
  }

  // ✅ 상품 렌더링
  function renderProducts(products) {
    productContainer.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.title}" />
        <h3>${product.title}</h3>
        <p>₩${product.price.toLocaleString()}</p>
        ${
          user && user.role === 'influencer'
            ? `<div class="reward-badge">리워드 ${product.rewardRate}%</div>`
            : ''
        }
      `;
      card.onclick = () => {
        localStorage.setItem('viewedProductId', product.id);
        location.href = `product.html?id=${product.id}`;
      };
      productContainer.appendChild(card);
    });
  }
});
