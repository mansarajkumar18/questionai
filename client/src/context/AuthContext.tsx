import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, institutionName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('qgen_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('qgen_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('qgen_user', JSON.stringify(res.data.user));
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('qgen_token', newToken);
        localStorage.setItem('qgen_user', JSON.stringify(newUser));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed.' };
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Login failed. Please check your credentials.';
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        message = 'Unable to reach backend server. Please ensure the backend is running and VITE_API_URL is configured.';
      } else if (err.response?.status === 404) {
        message = 'Authentication API endpoint not found (404). Please ensure the backend is deployed and VITE_API_URL is configured in Vercel.';
      } else if (err.response?.status === 502 || err.response?.status === 503) {
        message = 'Backend server is starting up or temporarily unreachable (502/503). Please retry in 20 seconds.';
      }
      return {
        success: false,
        message,
      };
    }
  };

  const register = async (name: string, email: string, password: string, institutionName?: string) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, institutionName });
      if (res.data?.success) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('qgen_token', newToken);
        localStorage.setItem('qgen_user', JSON.stringify(newUser));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Registration failed.' };
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = 'Registration failed.';
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        message = 'Unable to reach backend server. Please verify VITE_API_URL in Vercel.';
      } else if (err.response?.status === 404) {
        message = 'Backend API endpoint not found (404). Please configure VITE_API_URL in Vercel.';
      }
      return {
        success: false,
        message,
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('qgen_token');
    localStorage.removeItem('qgen_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

