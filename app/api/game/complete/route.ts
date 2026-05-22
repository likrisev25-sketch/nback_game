import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gamePlayers, gameSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface CompleteGameRequest {
  sessionId: string;
  playerId: string;
  correctAnswers: number;
  errors: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CompleteGameRequest = await request.json();
    const { sessionId, playerId, correctAnswers, errors } = body;

    if (!sessionId || !playerId) {
      return NextResponse.json(
        { error: 'sessionId и playerId обязательны' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Обновляем статистику игрока (если нужно)
    // В текущей реализации статистика обновляется в реальном времени через /answer
    // Здесь можно добавить финальное сохранение или обновление статуса сессии

    // Проверяем сессию
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
    }

    // Если игра завершена — обновляем статус
    if (session.status === 'playing') {
      const players = await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, sessionId),
      });

      // Проверяем, завершили ли все игроки игру (упрощённо)
      // В полной реализации нужно отслеживать статус каждого игрока
      await db
        .update(gameSessions)
        .set({
          status: 'finished',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(gameSessions.id, sessionId));
    }

    return NextResponse.json({
      success: true,
      message: 'Игра завершена',
    });
  } catch (error) {
    console.error('❌ ERROR completing game:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
