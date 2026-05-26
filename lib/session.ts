import type { NextRequest } from 'next/server';

// Простой клиент для получения сессии без зависимости от auth модуля
const API_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Получение сессии в Server Components
 * Используем кэширование для уменьшения нагрузки на БД
 */
const sessionCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 30000; // 30 секунд

export async function getSession(): Promise<any | null> {
  try {
    // В server components используем cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return null;
    }

    // Проверяем кэш
    const cached = sessionCache.get(token);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    // Получаем сессию через API
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        cookie: `session=${token}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Кэшируем успешный ответ
    sessionCache.set(token, {
      data,
      expires: Date.now() + CACHE_TTL,
    });
    
    return data;
  } catch (error) {
    console.error('[getSession] Error:', error);
    return null;
  }
}

/**
 * Получение сессии из API Route запроса
 */
export async function getSessionFromRequest(
  request?: Request | any
): Promise<any | null> {
  try {
    if (!request || !request.headers) {
      return null;
    }

    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return null;
    }
    
    const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='));
    if (!sessionCookie) {
      return null;
    }
    
    const token = sessionCookie.split('=')[1];
    if (!token) {
      return null;
    }

    // Проверяем кэш
    const cached = sessionCache.get(token);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    // Получаем сессию через API
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        cookie: `session=${token}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Кэшируем успешный ответ
    sessionCache.set(token, {
      data,
      expires: Date.now() + CACHE_TTL,
    });
    
    return data;
  } catch (error) {
    console.error('[getSessionFromRequest] Error:', error);
    return null;
  }
}

export async function getUserIdFromRequest(
  request?: Request | any
): Promise<string | null> {
  try {
    const session = await getSessionFromRequest(request);
    return session?.user?.id || null;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(
  request?: Request | any
): Promise<{ userId: string; session: any } | null> {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return null;
    }
    return {
      userId: session.user.id,
      session,
    };
  } catch (error) {
    return null;
  }
}
