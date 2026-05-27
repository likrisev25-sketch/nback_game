import type { NextRequest } from 'next/server';

/**
 * Получение базового URL для API
 */
function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Получение сессии в Server Components
 */
export async function getSession(): Promise<any | null> {
  try {
    // В server components используем cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return null;
    }

    const API_URL = getApiUrl();
    
    // Получаем сессию через API (без кэша)
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        cookie: `session=${token}`,
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
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
    
    const API_URL = getApiUrl();
    
    // Получаем сессию через API (без кэша)
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        cookie: `session=${token}`,
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.log('[getSessionFromRequest] Session not found or invalid');
      return null;
    }
    
    const data = await response.json();
    
    if (!data?.user?.id) {
      console.log('[getSessionFromRequest] No user in session');
      return null;
    }
    
    console.log('[getSessionFromRequest] Session found:', { userId: data.user.id, userName: data.user.name });
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
