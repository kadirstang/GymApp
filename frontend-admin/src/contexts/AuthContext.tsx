'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { User, LoginRequest, RegisterRequest } from '@/types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        // ⚠️ STUDENT KONTROLÜ - Eğer student ise logout yap
        if (parsedUser.role?.name === 'Student') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setLoading(false);
          return;
        }

        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiClient.login(credentials);

      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;

        // ⚠️ STUDENT GİRİŞİ ENGELLE - Sadece mobil app için
        if (user.role?.name === 'Student') {
          throw new Error('Öğrenciler web paneline giriş yapamaz. Lütfen mobil uygulamayı kullanın.');
        }

        // Store in state
        setUser(user);
        setToken(token);

        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await apiClient.register(data);

      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;

        // Store in state
        setUser(user);
        setToken(token);

        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Redirect to login
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
