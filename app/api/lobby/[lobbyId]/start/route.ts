import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers, gameSessions, sequences, gamePlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ lobbyId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { lobbyId } = await params;

    // Проверяем существование лобби
    const [lobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Проверяем что пользователь - хост
    const [player] = await db
      .select()
      .from(lobbyPlayers)
      .where(
        and(
          eq(lobbyPlayers.lobbyId, lobbyId),
          eq(lobbyPlayers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!player || !player.isHost) {
      return NextResponse.json({ error: 'Only host can start the game' }, { status: 403 });
    }

    // Проверяем что все игроки готовы
    const allPlayers = await db
      .select()
      .from(lobbyPlayers)
      .where(eq(lobbyPlayers.lobbyId, lobbyId));

    const allReady = allPlayers.every((p: typeof lobbyPlayers.$inferSelect) => p.isReady);
    if (!allReady) {
      return NextResponse.json({ error: 'Not all players are ready' }, { status: 400 });
    }

    // Проверяем минимальное количество игроков
    if (allPlayers.length < lobby.minPlayers) {
      return NextResponse.json({ 
        error: `Not enough players. Minimum ${lobby.minPlayers} players required, but ${allPlayers.length} joined.`
      }, { status: 400 });
    }

    // Обновляем статус лобби
    await db
      .update(lobbies)
      .set({ 
        status: 'countdown',
        startedAt: new Date().toISOString(),
      })
      .where(eq(lobbies.id, lobbyId));

    // Создаем игровую сессию
    const sessionId = nanoid();
    const totalSteps = 20; // Количество шагов в игре
    
    // Генерируем последовательность для игры
    const positions = Array.from({ length: totalSteps }, () => 
      Math.floor(Math.random() * 9)
    );

    await db.insert(gameSessions).values({
      id: sessionId,
      name: `${lobby.name} - Раунд 1`,
      nValue: lobby.nValue,
      baseSpeedMs: lobby.baseSpeedMs,
      currentSpeedMs: lobby.baseSpeedMs,
      maxPlayers: lobby.maxPlayers,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Создаем последовательность
    await db.insert(sequences).values({
      id: nanoid(),
      sessionId,
      positions: JSON.stringify(positions),
      totalSteps,
      createdAt: new Date().toISOString(),
    });

    // Создаем записи для игроков
    for (const p of allPlayers) {
      await db.insert(gamePlayers).values({
        id: nanoid(),
        sessionId,
        userId: p.userId,
        name: p.name,
        correctAnswers: 0,
        errors: 0,
        isBot: false,
        botAccuracy: 100,
        joinedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Game starting in 5 seconds...',
    });
  } catch (error) {
    console.error('[start] Error starting game:', error);
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
}

