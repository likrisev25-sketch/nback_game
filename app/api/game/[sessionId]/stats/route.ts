import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('📊 [stats] Запрос статистики для sessionId:', sessionId);

    // Получаем сессию
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      console.error('❌ [stats] Сессия не найдена');
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    // Получаем игроков
    const players = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionId),
      orderBy: [desc(gamePlayers.correctAnswers)],
    });

    console.log('📊 [stats] Игроки:', players.map((p: typeof gamePlayers.$inferSelect) => ({
      id: p.id,
      name: p.name,
      correctAnswers: p.correctAnswers,
      errors: p.errors,
    })));

    return NextResponse.json({
      session: {
        id: session.id,
        name: session.name,
        nValue: session.nValue,
        currentSpeedMs: session.currentSpeedMs,
        maxPlayers: session.maxPlayers,
        status: session.status,
      },
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        correctAnswers: p.correctAnswers,
        errors: p.errors,
        isBot: p.isBot,
        botAccuracy: p.botAccuracy,
        isHost: p.isHost,
      })),
    });
  } catch (error) {
    console.error('❌ [stats] Ошибка получения статистики:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
