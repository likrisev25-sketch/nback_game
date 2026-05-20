// Простой клиент аутентификации (без Better Auth)
// Updated: 2024-05-17 - Removed Better Auth dependency
'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

// Добавляем timestamp для проталкивания кэша
const CACHE_BUSTER = Date.now();

console.log('🔵 [auth-client] API_URL:', API_URL);
console.log('🔵 [auth-client] CACHE_BUSTER:', CACHE_BUSTER);

export const authClient = {
  // Регистрация
  signUp: async (email: string, password: string, name: string) => {
    console.log('🔵 [auth-client] signUp called:', email);
    const response = await fetch(`${API_URL}/api/register?t=${CACHE_BUSTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [auth-client] signUp error:', error);
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await response.json();
    console.log('✅ [auth-client] signUp success:', data);
    return data;
  },
  
  // Вход
  signIn: async (email: string, password: string) => {
    console.log('🔵 [auth-client] signIn called:', email);
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [auth-client] signIn error:', error);
      throw new Error(error.error || 'Sign in failed');
    }
    
    const data = await response.json();
    console.log('✅ [auth-client] signIn success:', data);
    return data;
  },
  
  // Выход
  signOut: async () => {
    console.log('🔵 [auth-client] signOut called');
    const response = await fetch(`${API_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    
    const result = await response.json();
    console.log('🔵 [auth-client] signOut result:', result);
    return result;
  },
  
  // Получение сессии
  getSession: async () => {
    console.log('🔵 [auth-client] getSession called');
    const response = await fetch(`${API_URL}/api/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });
    
    console.log('🔵 [auth-client] getSession response status:', response.status);
    
    if (!response.ok) {
      console.log('⚠️ [auth-client] getSession not OK, returning null');
      return { user: null, session: null };
    }
    
    const data = await response.json();
    console.log('🔵 [auth-client] getSession data:', data);
    return data;
  },
};

// Хук для получения сессии с использованием React Query
export function useSession() {
  const [data, setData] = useState<{ user: any; session: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const sessionData = await authClient.getSession();
      setData(sessionData);
      setError(null);
    } catch (err) {
      console.error('🔴 [useSession] Error fetching session:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch session'));
      setData({ user: null, session: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    data,
    isLoading,
    error,
    mutate: fetchSession,
  };
}

export const { signIn, signUp, signOut, getSession } = authClient;
