import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
    }

    const currentPlayers = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionId),
    });

    if (currentPlayers.length >= session.maxPlayers) {
      return NextResponse.json({ error: 'Максимальное количество игроков достигнуто' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const [bot] = await db.insert(gamePlayers).values({
      id: uuidv4(),
      sessionId,
      userId: uuidv4(),
      correctAnswers: 0,
      errors: 0,
      isBot: true,
      botAccuracy: Math.floor(Math.random() * 30) + 70,
      joinedAt: now,
    }).returning();

    return NextResponse.json({ success: true, botId: bot.id });
  } catch (error) {
    console.error('Error adding bot:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
