// frontend/scripts/login.js
import { api } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) {
    console.error("⚠️ loginForm 요소를 찾을 수 없습니다.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailOrPhone = form.emailOrPhone.value;
    const password = form.password.value;

    try {
      const response = await api.post("/api/auth/login", { emailOrPhone, password });

      if (response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("loginTimestamp", Date.now());

        alert("로그인 성공!");
        window.location.href = "/frontend/pages/shop.html";
      } else {
        alert("로그인 실패: " + (response.error || "서버 오류"));
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("로그인 요청 중 오류가 발생했습니다.");
    }
  });
});
