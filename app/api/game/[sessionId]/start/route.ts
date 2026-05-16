import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('🔵 START: Запуск игры для sessionId:', sessionId);

    // Проверяем авторизацию запрашивающего
    const session = await getSessionFromRequest(request);
    const userId = session?.user?.id;

    // Проверяем существование сессии
    console.log('🔵 Checking if session exists in DB...');
    const gameSession = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    console.log('🔵 Session from DB:', gameSession);

    if (!gameSession) {
      console.error('❌ Session not found in database!');
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    if (gameSession.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Игра уже началась или завершена' },
        { status: 400 }
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

    // Проверяем что запрашивающий является хостом (если авторизован)
    // Для неавторизованных игроков разрешаем старт без проверки хоста
    if (userId) {
      const hostPlayer = players.find(p => p.isHost);
      if (hostPlayer && hostPlayer.userId !== userId) {
        return NextResponse.json(
          { error: 'Только создатель игры может начать игру' },
          { status: 403 }
        );
      }
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
