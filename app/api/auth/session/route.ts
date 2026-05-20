import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

export async function GET(request: NextRequest) {
  console.log('🔵 [session] GET request received');
  
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    console.log('🔵 [session] Cookie header:', cookieHeader ? 'present' : 'empty');
    
    const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='));
    console.log('🔵 [session] Session cookie found:', !!sessionCookie);
    
    if (!sessionCookie) {
      console.log('⚠️ [session] No session cookie, returning null');
      return NextResponse.json({ user: null, session: null });
    }
    
    const token = sessionCookie.split('=')[1];
    console.log('🔵 [session] Token:', token?.substring(0, 10) + '...');
    
    if (!db) {
      console.error('❌ [session] Database not available');
      return NextResponse.json({ user: null, session: null });
    }
    
    // Поиск сессии по токену (без with, чтобы избежать ошибки referencedTable)
    const sessionData = await db.query.sessions.findFirst({
      where: (sessions: typeof schema.sessions, { eq }: any) => eq(sessions.token, token),
    });
    
    console.log('🔵 [session] Session from DB:', sessionData ? 'found' : 'not found');
    
    if (!sessionData || new Date(sessionData.expiresAt) < new Date()) {
      console.log('⚠️ [session] Session expired or not found');
      return NextResponse.json({ user: null, session: null });
    }
    
    // Отдельный запрос для получения пользователя
    const user = await db.query.users.findFirst({
      where: (users: typeof schema.users, { eq }: any) => eq(users.id, sessionData.userId),
    });
    
    console.log('🔵 [session] User from DB:', user ? 'found' : 'not found');
    
    if (!user) {
      console.log('⚠️ [session] User not found for session');
      return NextResponse.json({ user: null, session: null });
    }
    
    console.log('✅ [session] Valid session for user:', user.name);
    
    // Возвращаем только нужные поля
    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('❌ [session] Error:', error);
    console.error('❌ [session] Stack:', error.stack);
    return NextResponse.json({ user: null, session: null });
  }
}
