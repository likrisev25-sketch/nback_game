import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('🔵 START: Запуск игры для sessionId:', sessionId);

    // Проверяем существование сессии
    console.log('🔵 Checking if session exists in DB...');
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    console.log('🔵 Session from DB:', session);

    if (!session) {
      console.error('❌ Session not found in database!');
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    // Проверяем количество игроков
    console.log('🔵 Checking players...');
    const players = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionId),
    });

    console.log('🔵 Players count:', players.length);

    if (players.length < 1) {
      return NextResponse.json(
        { error: 'Нужен минимум 1 игрок' },
        { status: 400 }
      );
    }

    // Обновляем статус сессии
    console.log('🔵 Updating session status to playing...');
    const now = new Date().toISOString();
    await db
      .update(gameSessions)
      .set({
        status: 'playing',
        updatedAt: now,
      })
      .where(eq(gameSessions.id, sessionId));

    console.log('✅ SUCCESS: Game started');

    return NextResponse.json({
      success: true,
      message: 'Игра началась',
      sessionId,
      playerCount: players.length,
    });
  } catch (error) {
    console.error('❌ ERROR starting game:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
