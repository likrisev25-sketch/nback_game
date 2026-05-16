import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences, tournamentResults } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface CreateNextRoundRequest {
  tournamentId: string;
  nValue: number;
  totalSteps: number;
  baseSpeedMs: number;
  addBot: boolean;
  botAccuracy: number;
  botName?: string;
  prevSessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateNextRoundRequest = await request.json();
    const { tournamentId, nValue, totalSteps, baseSpeedMs, addBot, botAccuracy, botName, prevSessionId } = body;

    console.log('🏆 [tournament/next-round] Создание следующего раунда для турнира:', tournamentId);

    const now = new Date().toISOString();
    const newSessionId = uuidv4();

    // Генерируем последовательность
    const positions: number[] = [];
    for (let i = 0; i < totalSteps; i++) {
      if (i >= nValue && Math.random() < 0.3) {
        positions.push(positions[i - nValue]);
      } else {
        positions.push(Math.floor(Math.random() * 9));
      }
    }

    // Создаём новую сессию для раунда
    const [session] = await db
      .insert(gameSessions)
      .values({
        id: newSessionId,
        name: `Турнир ${tournamentId} - Раунд`,
        nValue,
        baseSpeedMs,
        currentSpeedMs: baseSpeedMs,
        maxPlayers: 2,
        status: 'waiting',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Сохраняем последовательность
    await db.insert(sequences).values({
      id: uuidv4(),
      sessionId: newSessionId,
      positions: JSON.stringify(positions),
      totalSteps,
      createdAt: now,
    });

    // Получаем игроков из предыдущей сессии (если есть)
    let prevPlayers: Array<{ id: string; isBot: boolean; botAccuracy?: number }> = [];
    if (prevSessionId) {
      prevPlayers = await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, prevSessionId),
      });
    }

    // Добавляем игрока (человека)
    const [player] = await db.insert(gamePlayers).values({
      id: uuidv4(),
      sessionId: newSessionId,
      userId: uuidv4(),
      correctAnswers: 0,
      errors: 0,
      isBot: false,
      botAccuracy: 100,
      joinedAt: now,
    }).returning();

    // Добавляем бота, если запрошено
    let botId: string | null = null;
    if (addBot) {
      const [bot] = await db.insert(gamePlayers).values({
        id: uuidv4(),
        sessionId: newSessionId,
        userId: uuidv4(),
        correctAnswers: 0,
        errors: 0,
        isBot: true,
        botAccuracy: botAccuracy || 80,
        joinedAt: now,
      }).returning();
      
      botId = bot.id;
      console.log('🤖 [tournament/next-round] Бот создан:', bot.id);
    }
      
    // Запускаем игру сразу
    await db
      .update(gameSessions)
      .set({
        status: 'playing',
        updatedAt: now,
      })
      .where(eq(gameSessions.id, newSessionId));

    console.log('🏆 [tournament/next-round] Раунд создан и запущен:', newSessionId);

    return NextResponse.json({
      success: true,
      sessionId: newSessionId,
      playerId: player.id,
      botId,
    });
  } catch (error) {
    console.error('❌ [tournament/next-round] Ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
