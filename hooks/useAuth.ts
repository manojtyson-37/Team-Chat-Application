'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: async () => {},
  setUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || 'Login failed' };
    }
    const data = await res.json();
    setUser(data);
    return {};
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || 'Registration failed' };
    }
    const data = await res.json();
    setUser(data);
    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, setUser };
}
