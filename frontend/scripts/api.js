// frontend/scripts/api.js
const BASE_URL = 'https://cross-border-backend-dc0m.onrender.com';

export const api = {
  async get(url) {
    const token = localStorage.getItem('token');
    const res = await fetch(BASE_URL + url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(url, data) {
    const token = localStorage.getItem('token');
    const res = await fetch(BASE_URL + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    if (contentType && contentType.includes('application/json')) {
      return res.json();
    } else {
      throw new Error('Invalid JSON response');
    }
  },

  async put(url, data) {
    const token = localStorage.getItem('token');
    const res = await fetch(BASE_URL + url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async upload(url, formData) {
    const token = localStorage.getItem('token');
    const res = await fetch(BASE_URL + url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async del(url) {
    const token = localStorage.getItem('token');
    const res = await fetch(BASE_URL + url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
