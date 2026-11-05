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
  const [token] = useState<string | null>('direct_access');
  const [loading] = useState<boolean>(false);

  const refreshUser = async () => {
    // In direct public workspace mode, user context is loaded from local workspace settings
    try {
      const saved = localStorage.getItem('qgen_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // Keep default workspace user
    }
  };

  const login = async () => ({ success: true });
  const register = async () => ({ success: true });
  const logout = () => {
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

