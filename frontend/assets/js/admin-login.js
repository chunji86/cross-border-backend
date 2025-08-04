document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminLoginForm');
  const errorMessage = document.getElementById('errorMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';

    const emailOrPhone = document.getElementById('emailOrPhone').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!emailOrPhone || !password) {
      errorMessage.textContent = '아이디와 비밀번호를 입력해 주세요.';
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user.role !== 'admin') {
          errorMessage.textContent = '관리자 계정이 아닙니다.';
          return;
        }

        localStorage.setItem('token', data.token);
        alert('관리자 로그인 성공!');
        window.location.href = '/frontend/pages/admin-dashboard.html';
      } else {
        errorMessage.textContent = data.error || '로그인 실패';
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      errorMessage.textContent = '서버 오류가 발생했습니다.';
    }
  });
});
