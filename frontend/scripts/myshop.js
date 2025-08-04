// 📁 frontend/assets/scripts/myshop.js (api.js 방식 리팩토링)
import API from "../scripts/api.js"; 

document.addEventListener("DOMContentLoaded", async () => {
  const listContainer = document.getElementById("myshop-list");

  async function loadMyShop() {
    try {
      const items = await apiGet("/myshop/view");
      listContainer.innerHTML = "";

      items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "border p-4 rounded shadow mb-4";

        card.innerHTML = `
          <img src="${item.imageUrl}" alt="상품 이미지" class="w-full h-48 object-cover mb-2" />
          <input type="text" value="${item.title}" class="title-input w-full border px-2 py-1 mb-2" />
          <textarea class="desc-input w-full border px-2 py-1 mb-2">${item.description}</textarea>
          <input type="number" value="${item.price}" class="price-input w-full border px-2 py-1 mb-2" />
          <div class="flex gap-2">
            <button class="update-btn bg-blue-500 text-white px-3 py-1 rounded" data-id="${item.id}">수정</button>
            <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded" data-id="${item.id}">삭제</button>
          </div>
        `;

        listContainer.appendChild(card);
      });
    } catch (err) {
      console.error("마이샵 불러오기 오류", err);
      alert("마이샵 로딩 실패");
    }
  }

  listContainer.addEventListener("click", async (e) => {
    if (e.target.classList.contains("update-btn")) {
      const id = e.target.dataset.id;
      const card = e.target.closest("div");

      const updated = {
        title: card.querySelector(".title-input").value,
        description: card.querySelector(".desc-input").value,
        price: parseInt(card.querySelector(".price-input").value),
      };

      try {
        await apiPatch(`/influencer-products/${id}`, updated);
        alert("수정 완료");
      } catch (err) {
        console.error("수정 실패", err);
        alert("수정 중 오류 발생");
      }
    }

    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      if (!confirm("정말 삭제하시겠습니까?")) return;

      try {
        await apiDelete(`/influencer-products/${id}`);
        alert("삭제 완료");
        await loadMyShop();
      } catch (err) {
        console.error("삭제 실패", err);
        alert("삭제 중 오류 발생");
      }
    }
  });

  // 첫 로딩
  await loadMyShop();
});
