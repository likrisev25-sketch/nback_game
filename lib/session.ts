// Файл: session.ts
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
export async function getSessionFromRequest(request: NextRequest) {
  // Получаем cookie из headers
  const cookieHeader = request.headers.get('cookie');
  const cookieMatch = cookieHeader?.match(/session=([^;]+)/);
  const token = cookieMatch ? cookieMatch[1] : null;
  
  console.log('🔵 [getSessionFromRequest] Token from cookie:', token ? 'found' : 'not found');
  
  if (!token) {
    return null;
  }
  
  return await auth.getSession(token);
}

/**
 * Проверка авторизации в API Route
 * Возвращает user или null (для гостевого режима)
 */
export async function requireAuth(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.user) {
    return null;
  }
  return session.user;
}
