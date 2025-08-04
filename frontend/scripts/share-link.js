import { post } from './api.js';

// 공유 버튼 클릭 이벤트 핸들러
document.addEventListener('DOMContentLoaded', () => {
  const shareBtn = document.getElementById('share-btn');
  const shareResult = document.getElementById('share-result');

  if (!shareBtn || !shareResult) return;

  shareBtn.addEventListener('click', async () => {
    try {
      // 현재 페이지의 상품 ID 추출
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('productId');

      if (!productId) {
        alert('상품 ID를 찾을 수 없습니다.');
        return;
      }

      // API 호출: 공유 링크 생성
      const response = await post('/api/promotion-links/generate', { productId });

      if (response && response.promotionLink) {
        const fullLink = `${window.location.origin}/frontend/pages/product.html?productId=${productId}&ref=${response.promotionLink.id}`;
        shareResult.innerHTML = `
          <p>공유 링크가 생성되었습니다:</p>
          <input type="text" id="copy-input" value="${fullLink}" readonly />
          <button id="copy-btn">복사</button>
        `;

        // 복사 버튼 이벤트
        const copyBtn = document.getElementById('copy-btn');
        const copyInput = document.getElementById('copy-input');

        copyBtn.addEventListener('click', () => {
          copyInput.select();
          document.execCommand('copy');
          alert('링크가 복사되었습니다!');
        });
      } else {
        alert('링크 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('링크 생성 오류:', error);
      alert('링크 생성 중 오류가 발생했습니다.');
    }
  });
});
