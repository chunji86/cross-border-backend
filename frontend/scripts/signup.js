// 📁 frontend/scripts/signup.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const roleSelect = document.getElementById('roleSelect');
  const vendorFiles = document.getElementById('vendorFiles');
  const influencerFiles = document.getElementById('influencerFiles');
  const errorMessage = document.getElementById('errorMessage'); // 필요 시 에러 출력용

  roleSelect.addEventListener('change', () => {
    const role = roleSelect.value;
    vendorFiles.style.display = role === 'vendor' ? 'block' : 'none';
    influencerFiles.style.display = (role === 'influencer' || role === 'pro_influencer') ? 'block' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const emailOrPhone = formData.get('emailOrPhone');
    const role = formData.get('role');

    const isEmail = emailOrPhone.includes('@');
    formData.set('email', isEmail ? emailOrPhone : '');
    formData.set('phone', isEmail ? '' : emailOrPhone);
    formData.set('isAdvanced', role === 'pro_influencer'); // true/false
    formData.set('role', role === 'pro_influencer' ? 'influencer' : role);
    formData.delete('emailOrPhone');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (res.ok) {
        alert('회원가입 성공!');
        location.href = '/frontend/pages/login.html';
      } else {
        alert('회원가입 실패: ' + result.error);
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
      alert('서버 오류가 발생했습니다.');
    }
  });
});
