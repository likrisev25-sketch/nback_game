import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

// Кэшируем сессии на короткое время для уменьшения нагрузки на БД
const sessionCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 30000; // 30 секунд

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='));
    
    if (!sessionCookie) {
      return NextResponse.json({ user: null, session: null });
    }
    
    const token = sessionCookie.split('=')[1];
    if (!token) {
      return NextResponse.json({ user: null, session: null });
    }

    // Проверяем кэш
    const cached = sessionCache.get(token);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data);
    }
    
    // Получаем подключение к БД
    let db;
    try {
      db = getDb();
    } catch (error) {
      console.error('[session] Database connection failed:', error);
      return NextResponse.json({ user: null, session: null });
    }
    
    // Поиск сессии по токену
    const sessionData = await db.query.sessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.token, token),
    });
    
    if (!sessionData || new Date(sessionData.expiresAt) < new Date()) {
      sessionCache.delete(token);
      return NextResponse.json({ user: null, session: null });
    }
    
    // Отдельный запрос для получения пользователя
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, sessionData.userId),
    });
    
    if (!user) {
      sessionCache.delete(token);
      return NextResponse.json({ user: null, session: null });
    }
    
    const responseData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      session: {
        id: sessionData.id,
        token: sessionData.token,
        expiresAt: sessionData.expiresAt,
      },
    };

    // Кэшируем успешный ответ
    sessionCache.set(token, {
      data: responseData,
      expires: Date.now() + CACHE_TTL,
    });
    
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('[session] Error:', error);
    return NextResponse.json({ user: null, session: null });
  }
}
