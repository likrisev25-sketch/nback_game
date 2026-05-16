import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    console.log('🏆 [tournament/start] Запуск турнира:', tournamentId);

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId обязателен' },
        { status: 400 }
      );
    }

    // Проверяем сессию
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    // Получаем игроков
    const players = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionId),
    });

    // Обновляем статус сессии
    const now = new Date().toISOString();
    await db
      .update(gameSessions)
      .set({
        status: 'playing',
        updatedAt: now,
      })
      .where(eq(gameSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: 'Турнир запущен',
      sessionId,
      playerCount: players.length,
    });
  } catch (error) {
    console.error('❌ [tournament/start] Ошибка запуска турнира:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
