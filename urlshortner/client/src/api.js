const API_BASE = '/api';

function getStoredToken() {
  return localStorage.getItem('token');
}

function setStoredToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Network request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    async me() {
      try {
        return await request('/auth/me');
      } catch (err) {
        if (err.status === 401) return null;
        throw err;
      }
    },
    async login({ email, password }) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) setStoredToken(data.token);
      return data;
    },
    async signup({ name, email, password }) {
      const data = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (data.token) setStoredToken(data.token);
      return data;
    },
    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setStoredToken(null);
      }
    },
  },

  urls: {
    async list(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, String(val));
        }
      });
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return await request(`/urls${queryString}`);
    },

    async create({ url, title, customAlias, expiresAt }) {
      return await request('/urls', {
        method: 'POST',
        body: JSON.stringify({ url, title, customAlias, expiresAt }),
      });
    },

    async bulkCreate(urls) {
      return await request('/urls/bulk', {
        method: 'POST',
        body: JSON.stringify({ urls }),
      });
    },

    async getAnalytics(shortId) {
      return await request(`/urls/${shortId}/analytics`);
    },

    async update(id, { title, url, status, expiresAt }) {
      return await request(`/urls/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, url, status, expiresAt }),
      });
    },

    async delete(id) {
      return await request(`/urls/${id}`, {
        method: 'DELETE',
      });
    },

    async bulkStatus(ids, status) {
      return await request('/urls/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ ids, status }),
      });
    },

    async bulkDelete(ids) {
      return await request('/urls/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids, confirm: 'delete' }),
      });
    },

    async multiplyAnalytics(shortId, factor) {
      return await request(`/urls/${shortId}/multiply`, {
        method: 'POST',
        body: JSON.stringify({ factor, confirm: 'multiply' }),
      });
    },
  },
};
