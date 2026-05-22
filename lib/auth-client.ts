// Простой клиент аутентификации (без Better Auth)
// Updated: 2024-05-17 - Removed Better Auth dependency
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

// Хук для получения сессии
// Используем модульный уровень для кэширования между рендерами
let sessionCache: { user: { id: string; name: string; email: string }; session: { id: string; token: string; expiresAt: string } } | null | 'loading' = 'loading';
let sessionCachePromise: Promise<{ user: { id: string; name: string; email: string }; session: { id: string; token: string; expiresAt: string } | null }> | null = null;

export function useSession() {
  const [data, setData] = useState<{ user: { id: string; name: string; email: string }; session: { id: string; token: string; expiresAt: string } } | null>(sessionCache === 'loading' ? null : sessionCache);
  const [isLoading, setIsLoading] = useState(sessionCache === 'loading');
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const fetchOnceRef = useRef<boolean>(false);

  const fetchSession = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // Если уже загружали - не загружаем снова
    if (fetchOnceRef.current && sessionCache !== 'loading') {
      setData(sessionCache);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const sessionData = await authClient.getSession();
      if (isMountedRef.current) {
        sessionCache = sessionData;
        setData(sessionData);
        setError(null);
        fetchOnceRef.current = true;
      }
    } catch (err) {
      console.error('🔴 [useSession] Error fetching session:', err);
      if (isMountedRef.current) {
        sessionCache = null;
        setError(err instanceof Error ? err : new Error('Failed to fetch session'));
        setData(null);
        fetchOnceRef.current = true;
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Загружаем сессию только один раз при монтировании
    if (!fetchOnceRef.current) {
      fetchSession();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSession]);

  return {
    data,
    isLoading,
    error,
    mutate: fetchSession,
  };
}

export const { signIn, signUp, signOut, getSession } = authClient;
