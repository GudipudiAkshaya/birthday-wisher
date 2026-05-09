// src/context/AuthContext.tsx - Global auth state management
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ requiresVerification?: boolean; email?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ requiresVerification?: boolean; email?: string }>;
  loginWithToken: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('bw_token');
    const storedUser = localStorage.getItem('bw_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });

    // Handle errors from backend
    if (res.data.success === false) {
      throw { response: { data: { message: res.data.message } } };
    }

    if (res.data.requiresVerification) {
      return { requiresVerification: true, email: res.data.email };
    }
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('bw_token', t);
    localStorage.setItem('bw_user', JSON.stringify(u));
    return {};
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/signup', { name, email, password });
    
    // Handle errors from backend
    if (res.data.success === false) {
      throw { response: { data: { message: res.data.message } } };
    }

    // If verification is needed, do NOT set user state yet
    if (res.data.requiresVerification) {
      return { requiresVerification: true, email: res.data.email };
    }

    // Otherwise, log them in immediately
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('bw_token', t);
    localStorage.setItem('bw_user', JSON.stringify(u));
    return {};
  };

  // Used after OTP verification — caller already has token+user from the API response
  const loginWithToken = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('bw_token', t);
    localStorage.setItem('bw_user', JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bw_token');
    localStorage.removeItem('bw_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, loginWithToken, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
