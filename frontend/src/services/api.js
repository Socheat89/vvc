import axios from 'axios';

const API_URL = 'https://app.vvc.asia/vvc_web/vvc/backend/public/index.php/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  // Dispatch global loading event
  window.dispatchEvent(new Event('api-request-start'));

  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => {
    // Dispatch global loading event
    window.dispatchEvent(new Event('api-request-end'));
    return response;
  },
  (error) => {
    // Dispatch global loading event
    window.dispatchEvent(new Event('api-request-end'));
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const productService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/products/${id}`, data);
    }

    return api.put(`/products/${id}`, data);
  },
  delete: (id) => api.delete(`/products/${id}`),
  import: async (file) => {
    window.dispatchEvent(new Event('api-request-start'));
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/products/import`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { message: await response.text() };

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }

      if (!response.ok) {
        const error = new Error(data.message || 'Failed to import Excel');
        error.response = { status: response.status, data };
        throw error;
      }

      window.dispatchEvent(new Event('api-request-end'));
      return { data };
    } catch (error) {
      window.dispatchEvent(new Event('api-request-end'));
      throw error;
    }
  },
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  import: async (file) => {
    window.dispatchEvent(new Event('api-request-start'));
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/categories/import`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };

    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }

    if (!response.ok) {
      const error = new Error(data.message || 'Failed to import categories');
      error.response = { status: response.status, data };
      throw error;
    }

    window.dispatchEvent(new Event('api-request-end'));
    return { data };
    } catch (error) {
      window.dispatchEvent(new Event('api-request-end'));
      throw error;
    }
  },
};

export const authService = {
  login: (email, password) => api.post('/login', { email, password }),
  logout: () => api.post('/logout'),
  getMe: () => api.get('/me'),
};

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const bannerService = {
  getAll: () => api.get('/banners'),
  getById: (id) => api.get(`/banners/${id}`),
  adminGetAll: () => api.get('/banners/admin/all'),
  create: (data) => api.post('/banners', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/banners/${id}`, data);
    }

    return api.put(`/banners/${id}`, data);
  },
  delete: (id) => api.delete(`/banners/${id}`),
};

export default api;
