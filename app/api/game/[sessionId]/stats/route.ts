import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    const players = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionId),
    });

    return NextResponse.json({
      session,
      players: players.map(p => ({
        id: p.id,
        name: p.isBot ? 'Бот' : 'Игрок',
        correctAnswers: p.correctAnswers,
        errors: p.errors,
        isBot: p.isBot,
        botAccuracy: p.botAccuracy,
      })),
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
