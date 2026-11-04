import axios from 'axios';

// Resolve base URL from environment or fallback to relative path
const rawBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

/**
 * Helper to construct full backend URLs for file downloads, PDFs, and assets.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // If cleanPath already begins with /api/v1, adjust prefix
  if (cleanPath.startsWith('/api/v1')) {
    const sub = cleanPath.slice('/api/v1'.length);
    return `${API_BASE_URL}${sub}`;
  }
  return `${API_BASE_URL}${cleanPath}`;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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
  (response) => {
    // Detect if Vercel returned HTML index.html instead of JSON API response
    if (
      typeof response.data === 'string' &&
      response.data.includes('<!doctype html>') &&
      response.config.url?.includes('/auth/')
    ) {
      return Promise.reject({
        response: {
          status: 502,
          data: {
            success: false,
            message:
              'Backend service unreachable. Please ensure the backend is deployed and VITE_API_URL is configured in Vercel.',
          },
        },
      });
    }
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/shared/')
    ) {
      localStorage.removeItem('qgen_token');
      localStorage.removeItem('qgen_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
