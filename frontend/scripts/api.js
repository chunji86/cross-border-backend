// frontend/scripts/api.js
export const api = {
  async get(url) {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(url, data) {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async put(url, data) {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
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
    const res = await fetch(url, {
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
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
