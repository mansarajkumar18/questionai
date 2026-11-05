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

const DEFAULT_WORKSPACE_USER: User = {
  id: 'faculty-educator',
  email: 'teacher@qgenai.edu',
  name: 'Faculty Educator',
  role: 'TEACHER',
  institution: {
    id: 'default-inst',
    name: 'Apex Institute of Science & Technology',
    address: 'Knowledge Campus, Chennai, Tamil Nadu',
    contactEmail: 'contact@apex.edu',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('qgen_user');
      return saved ? JSON.parse(saved) : DEFAULT_WORKSPACE_USER;
    } catch {
      return DEFAULT_WORKSPACE_USER;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('qgen_token') || 'direct_access_token');
  const [loading, setLoading] = useState<boolean>(false);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('qgen_user', JSON.stringify(res.data.user));
      }
    } catch {
      // Backend not yet connected or offline: maintain default workspace user
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async () => {
    return { success: true };
  };

  const register = async () => {
    return { success: true };
  };

  const logout = () => {
    // In public access mode, reset to default workspace user
    setUser(DEFAULT_WORKSPACE_USER);
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

