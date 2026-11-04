import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qgen_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/shared/')) {
      localStorage.removeItem('qgen_token');
      localStorage.removeItem('qgen_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
