async function register() {
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const name = document.getElementById("name").value;
  const role = document.querySelector('input[name="role"]:checked')?.value;

  if (!email || !phone || !password || !role) {
    alert("이메일, 전화번호, 비밀번호, 역할은 필수 항목입니다.");
    return;
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        phone,
        password,
        name,
        role
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert("회원가입 성공! 로그인 페이지로 이동합니다.");
      window.location.href = "/frontend/pages/login.html";
    } else {
      alert(data.error || "회원가입 실패");
    }
  } catch (err) {
    console.error("회원가입 오류:", err);
    alert("서버 오류가 발생했습니다.");
  }
}
