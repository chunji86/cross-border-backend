import { apiPut, getTokenFromCookie } from "../assets/api.js";

// 폼 제출 이벤트 처리
document.getElementById("editForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = document.getElementById("productId").value;
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const imageUrl = document.getElementById("imageUrl").value;
  const price = parseInt(document.getElementById("price").value, 10);

  const token = getTokenFromCookie();

  const res = await apiPut(`/api/influencer-products/${id}`, {
    title, description, imageUrl, price
  }, token);

  if (res && res.updated) {
    alert("수정이 완료되었습니다!");
    location.reload();
  } else {
    alert("수정 실패: " + (res?.error || "서버 오류"));
  }
});
