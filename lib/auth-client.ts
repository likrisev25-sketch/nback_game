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
// Используем React Context для общего состояния сессии
import { createContext, useContext, ReactNode } from 'react';

interface SessionContextType {
  data: { user: { id: string; name: string; email: string }; session: { id: string; token: string; expiresAt: string } } | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
}

// Создаём контекст один раз
const SessionContext = createContext<SessionContextType | null>(null);

// Глобальное состояние сессии (один экземпляр для всего приложения)
let globalSessionData: { user: { id: string; name: string; email: string }; session: { id: string; token: string; expiresAt: string } } | null = null;
let globalSessionLoading = true;
let globalSessionError: Error | null = null;
let sessionLoadPromise: Promise<void> | null = null;
let sessionLoadCompleted = false;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<{ user: { id: string; name: string; email: string }; session: { id: string; token: string; expiresAt: string } } | null>(globalSessionData);
  const [isLoading, setIsLoading] = useState(globalSessionLoading);
  const [error, setError] = useState<Error | null>(globalSessionError);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  const loadSession = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      const sessionData = await authClient.getSession();
      if (isMountedRef.current) {
        globalSessionData = sessionData;
        globalSessionLoading = false;
        setData(sessionData);
        setError(null);
      }
    } catch (err) {
      console.error('🔴 [useSession] Error fetching session:', err);
      if (isMountedRef.current) {
        globalSessionData = null;
        globalSessionLoading = false;
        globalSessionError = err instanceof Error ? err : new Error('Failed to fetch session');
        setData(null);
        setError(globalSessionError);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        globalSessionLoading = false;
        sessionLoadCompleted = true;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Загружаем сессию только один раз для всего приложения
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadSession();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSession]);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const sessionData = await authClient.getSession();
      if (isMountedRef.current) {
        globalSessionData = sessionData;
        setData(sessionData);
        setError(null);
      }
    } catch (err) {
      console.error('🔴 [useSession] Error refetching session:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch session'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return (
    <SessionContext.Provider value={{ data, isLoading, error, mutate: refetch }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

export const { signIn, signUp, signOut, getSession } = authClient;
