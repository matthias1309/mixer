'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { apiCall } from '../lib/api';
import { apiUrl } from '@lib/api-url';

export interface User {
  id: number;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch(apiUrl('/api/auth/me'), {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: apiError } = await apiCall<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (apiError) {
        setError(apiError);
        throw new Error(apiError);
      }

      setUser(data?.user || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(email: string, password: string) {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: apiError } = await apiCall<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (apiError) {
        setError(apiError);
        throw new Error(apiError);
      }

      setUser(data?.user || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setError(null);
    try {
      const { error: apiError } = await apiCall('/auth/logout', {
        method: 'POST',
      });

      if (apiError) {
        setError(apiError);
      }

      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
