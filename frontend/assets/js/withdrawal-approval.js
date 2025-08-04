async function loadWithdrawals() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("content");
  container.innerHTML = "<h2>출금 승인 목록</h2>";

  try {
    const res = await fetch("/api/withdrawals/pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "불러오기 실패");

    if (data.length === 0) {
      container.innerHTML += "<p>대기 중인 출금 요청이 없습니다.</p>";
      return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>출금 ID</th><th>사용자 ID</th><th>금액</th><th>신청일</th><th>상태</th><th>조치</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (w) => `
          <tr>
            <td>${w.id}</td>
            <td>${w.userId}</td>
            <td>${w.amount}</td>
            <td>${new Date(w.createdAt).toLocaleString()}</td>
            <td>${w.status}</td>
            <td>
              <button onclick="handleApproval(${w.id}, 'approved')">승인</button>
              <button onclick="handleApproval(${w.id}, 'rejected')">거절</button>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    `;
    container.appendChild(table);
  } catch (err) {
    container.innerHTML += `<p style="color:red;">오류: ${err.message}</p>`;
  }
}

async function handleApproval(withdrawalId, action) {
  const token = localStorage.getItem("token");
  const confirmMsg = action === "approved" ? "승인" : "거절";
  if (!confirm(`${withdrawalId}번 출금 요청을 ${confirmMsg}하시겠습니까?`)) return;

  try {
    const res = await fetch(`/api/withdrawals/${withdrawalId}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "처리 실패");
    alert("처리 완료!");
    loadWithdrawals(); // 새로고침
  } catch (err) {
    alert(`오류: ${err.message}`);
  }
}
