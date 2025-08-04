// frontend/scripts/auth.js

export const auth = {
  saveToken(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('loginTimestamp', Date.now()); // 자동 로그아웃 대비
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
  },

  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  isTokenExpired() {
    const timestamp = localStorage.getItem('loginTimestamp');
    if (!timestamp) return true;
    const maxAge = 2 * 60 * 60 * 1000; // 2시간
    return Date.now() - parseInt(timestamp) > maxAge;
  }
};
