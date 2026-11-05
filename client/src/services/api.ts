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
    return response;
  },
  (error) => {
    // Non-blocking error handling - no redirect to /login
    return Promise.reject(error);
  }
);

export default api;
