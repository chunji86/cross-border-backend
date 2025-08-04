// frontend/scripts/share-link.js

import { api } from './api.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = auth.getUser();
  const shareButton = document.getElementById('share-btn');
  const messageDiv = document.getElementById('message');
  const linkOutput = document.getElementById('generated-link');
  const copyBtn = document.getElementById('copy-btn');

  if (!user || user.role !== 'INFLUENCER') {
    alert('인플루언서만 접근 가능한 기능입니다.');
    window.location.href = '/frontend/pages/login.html';
    return;
  }

  shareButton.addEventListener('click', async () => {
    const productId = document.getElementById('product-id').value;

    if (!productId) {
      messageDiv.innerText = '상품 ID를 입력해주세요.';
      return;
    }

    try {
      const result = await api.post('/api/promotion-links/generate', {
        productId
      });

      const fullUrl = `${window.location.origin}/frontend/pages/product.html?ref=${result.code}`;
      linkOutput.value = fullUrl;
      messageDiv.innerText = '공유 링크가 생성되었습니다.';
      copyBtn.style.display = 'inline-block';
    } catch (err) {
      messageDiv.innerText = `오류 발생: ${err.message}`;
    }
  });

  copyBtn.addEventListener('click', () => {
    const link = linkOutput.value;
    navigator.clipboard.writeText(link).then(() => {
      alert('링크가 복사되었습니다.');
    }).catch(() => {
      alert('복사에 실패했습니다.');
    });
  });
});
