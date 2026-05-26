import { auth } from '@/server/auth';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { NextRequest } from 'next/server';

/**
 * Получение сессии в Server Components (React cache для дедупликации)
 */
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) {
    return null;
  }
  
  return await auth.getSession(token);
});

/**
 * Получение сессии из API Route запроса
 */
export async function getSessionFromRequest(
  request?: Request | any
): Promise<ReturnType<typeof getSession> | null> {
  try {
    // Для серверных API используем прямой доступ к кукам из заголовков
    if (request && request.headers) {
      const cookieHeader = request.headers.get('cookie');
      const cookieMatch = cookieHeader?.match(/session=([^;]+)/);
      const token = cookieMatch ? cookieMatch[1] : null;
      
      if (!token) {
        return null;
      }
      
      return await auth.getSession(token);
    }
    
    // Для клиентских вызовов используем cookies()
    const sessionData = await getSession();
    return sessionData;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getUserIdFromRequest(
  request?: Request | any
): Promise<string | null> {
  const session = await getSessionFromRequest(request);
  return session?.user?.id || null;
}

export async function requireAuth(
  request?: Request | any
): Promise<{ userId: string; session: any }> {
  const session = await getSessionFromRequest(request);

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.user.id,
    session,
  };
}
