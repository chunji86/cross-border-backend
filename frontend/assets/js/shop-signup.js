// 📁 frontend/assets/shop-signup.js (고객용)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('shopSignupForm');
  const errorMessage = document.getElementById('errorMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';

    const formData = new FormData(form);
    const emailOrPhone = formData.get('emailOrPhone');
    const password = formData.get('password');

    formData.set('email', emailOrPhone.includes('@') ? emailOrPhone : '');
    formData.set('phone', emailOrPhone.includes('@') ? '' : emailOrPhone);
    formData.set('role', 'customer');
    formData.set('isAdvanced', false);
    formData.set('snsLinks', JSON.stringify([]));
    formData.delete('emailOrPhone');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert('회원가입 성공');
        window.location.href = '/frontend/pages/login.html';
      } else {
        errorMessage.textContent = data.error || '회원가입 실패';
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
      errorMessage.textContent = '서버 오류 발생';
    }
  });
});
