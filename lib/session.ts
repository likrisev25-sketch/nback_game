import { auth } from '@/server/auth';
import { headers } from 'next/headers';
import { cache } from 'react';
import type { NextRequest } from 'next/server';

/**
 * Получение сессии в Server Components (React cache для дедупликации)
 */
export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});

/**
 * Получение сессии из API Route запроса
 */
export async function getSessionFromRequest(request: NextRequest) {
  return await auth.api.getSession({
    headers: request.headers,
  });
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
