export const auth = {
  saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('loginTimestamp', Date.now().toString());
  },
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
  },
  isTokenExpired() {
    const timestamp = localStorage.getItem('loginTimestamp');
    if (!timestamp) return true;
    const expireTime = 2 * 60 * 60 * 1000; // 2시간
    return Date.now() - parseInt(timestamp) > expireTime;
  },
  getToken() {
    const user = this.getUser();
    return user ? user.token : null;
  },
};
