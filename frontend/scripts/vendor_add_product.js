document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) return alert('로그인 정보가 없습니다.');

  const form = e.target;
  const formData = new FormData(form);

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert('상품이 등록되었습니다.');
      form.reset();
    } else {
      alert(data.error || '상품 등록 실패');
    }
  } catch (err) {
    console.error(err);
    alert('서버 오류');
  }
});
