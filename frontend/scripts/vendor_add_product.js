import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('product-form');
  const logoutBtn = document.getElementById('logout-btn');
  const usernameSpan = document.getElementById('username');

  // 로그인 상태 확인
  const user = auth.getUser();
  if (!user || user.role !== 'vendor') {
    alert('접근 권한이 없습니다.');
    window.location.href = '/frontend/pages/login.html';
    return;
  }

  // 사용자 이름 표시
  if (usernameSpan) {
    usernameSpan.textContent = user.name || user.email || '공급사';
  }

  // 로그아웃 처리
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }

  // 상품 등록 이벤트
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const imageFile = document.getElementById('image').files[0];
    const countrySelect = document.getElementById('country');
    const shipping = document.querySelector('input[name="shipping"]:checked')?.value;

    const countries = Array.from(countrySelect.selectedOptions).map(opt => opt.value);

    if (!name || !description || !price || !imageFile || countries.length === 0 || !shipping) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('image', imageFile);
    formData.append('countries', JSON.stringify(countries));
    formData.append('shipping', shipping);

    try {
      await api.upload('/api/products', formData);
      alert('상품이 성공적으로 등록되었습니다.');
      form.reset();
    } catch (err) {
      console.error('상품 등록 오류:', err);
      alert('상품 등록에 실패했습니다: ' + err.message);
    }
  });
});
