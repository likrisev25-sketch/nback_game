// Простой клиент аутентификации (без Better Auth)
'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode, useMemo } from 'react';

const API_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
const CACHE_BUSTER = Date.now();

console.log('[auth-client] API_URL:', API_URL);

export const authClient = {
  signUp: async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { error: new Error(error.error || 'Registration failed') };
      }
      
      const data = await response.json();
      return { data };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Registration failed') };
    }
  },
  
  signIn: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { error: new Error(error.error || 'Sign in failed') };
      }
      
      const data = await response.json();
      return { data };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  },
  
  signOut: async () => {
    const response = await fetch(`${API_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return await response.json();
  },
  
  getSession: async () => {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      return { user: null, session: null };
    }
    
    return await response.json();
  },
};

interface SessionContextType {
  data: { user: { id: string; name: string; email: string }; session: { id: string; token: string; expiresAt: string } } | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

// Глобальное состояние сессии (для серверного рендеринга)
// На клиенте это будет переопределено первым рендером
let globalSessionData: { user: { id: string; name: string; email: string }; session: { id: string; token: string; expiresAt: string } } | null = null;
let globalSessionLoading = false; // Меняем на false, чтобы избежать лишнего loading состояния
let globalSessionError: Error | null = null;

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
      console.error('[useSession] Error fetching session:', err);
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
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadSession();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      console.error('[useSession] Error refetching session:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch session'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const value = useMemo(() => ({ data, isLoading, error, mutate: refetch }), [data, isLoading, error, refetch]);

  return (
    <SessionContext.Provider value={value}>
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
