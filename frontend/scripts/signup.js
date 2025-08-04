// frontend/scripts/signup.js

import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const snsList = [];

  const platformSelect = document.getElementById('sns-platform');
  const linkInput = document.getElementById('sns-link');
  const addBtn = document.getElementById('add-sns-btn');
  const snsContainer = document.getElementById('sns-container');

  // ✅ SNS 링크 추가
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const platform = platformSelect.value;
    const link = linkInput.value.trim();

    if (!link) return alert('링크를 입력해주세요.');
    snsList.push({ platform, link });

    const li = document.createElement('li');
    li.textContent = `${platform}: ${link}`;
    snsContainer.appendChild(li);
    linkInput.value = '';
  });

  // ✅ 회원가입 제출
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const role = formData.get('role');

    // JSON에 넣을 기본값
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      password: formData.get('password'),
      role,
      snsLinks: JSON.stringify(snsList)
    };

    // ✅ 역할에 따라 파일 필드 처리
    const uploadData = new FormData();
    Object.entries(payload).forEach(([key, val]) => uploadData.append(key, val));

    if (role === 'supplier') {
      uploadData.append('bizLicense', formData.get('bizLicense'));
      uploadData.append('bankbook', formData.get('bankbook'));
      uploadData.append('ecommerceCert', formData.get('ecommerceCert'));
    } else if (role === 'influencer') {
      uploadData.append('idCard', formData.get('idCard'));
      uploadData.append('bankbook', formData.get('bankbook'));
    }

    try {
      const result = await api.upload('/api/auth/signup', uploadData);
      alert('회원가입 완료! 로그인해주세요.');
      window.location.href = '/frontend/pages/login.html';
    } catch (err) {
      alert('회원가입 실패: ' + err.message);
    }
  });
});
