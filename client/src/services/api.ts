import axios from 'axios';

// Resolve base URL from environment or fallback to relative path
const rawBaseUrl = (import.meta.env.VITE_API_URL || '').trim();

let resolvedUrl = '/api/v1';
if (rawBaseUrl) {
  const cleanUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  // If the user configured an external URL without /api or /api/v1, default to appending /api/v1
  if (!cleanUrl.endsWith('/api/v1') && !cleanUrl.endsWith('/api')) {
    resolvedUrl = `${cleanUrl}/api/v1`;
  } else {
    resolvedUrl = cleanUrl;
  }
}

export const API_BASE_URL = resolvedUrl;

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
    // Detect if Vercel or proxy returned HTML (such as index.html) instead of JSON API response
    if (
      typeof response.data === 'string' &&
      (response.data.toLowerCase().includes('<!doctype html>') || response.data.includes('<html'))
    ) {
      return Promise.reject({
        response: {
          status: 502,
          data: {
            success: false,
            message:
              'Backend service unreachable. Vercel served HTML instead of the API response. Please configure VITE_API_URL in Vercel to point to your deployed backend (e.g., Render/Railway).',
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
