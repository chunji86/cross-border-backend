// 📁 frontend/assets/shop-login.js (고객 로그인 전용)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('shopLoginForm');
  const errorMessage = document.getElementById('errorMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';

    const formData = new FormData(form);
    const emailOrPhone = formData.get('emailOrPhone');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password })
      });

      const data = await res.json();

      if (res.ok) {
        alert('로그인 성공');
        window.location.href = '/frontend/pages/shop-main.html'; // 로그인 후 이동할 페이지
      } else {
        errorMessage.textContent = data.error || '로그인 실패';
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      errorMessage.textContent = '서버 오류가 발생했습니다.';
    }
  });
});
